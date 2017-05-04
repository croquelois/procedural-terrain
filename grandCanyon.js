/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"uset strict";
let Grid = require("Grid");
let Terrain = require("Terrain");
let Perlin = require("PerlinSimplex");
let Util = require("./Util");
let Gradients = require("./CommonGradients");
let assert = require("assert");

let msToHuman = Util.msToHuman;
let normalize = Util.normalize;
let sun = normalize({x:0.5,y:0.5,z:-0.5});

function LayeredTerrain(w,h){
  this.grid = new Grid(w,h);
}

LayeredTerrain.prototype.addLayer = function(scaleNoise, avgDepth, varDepth, color, softness){
  let P = new Perlin();
  let w = this.grid.w;
  let h = this.grid.h;
  P.noiseDetail(4,0.25);
  this.grid.each(function(p,v){
    let depth = avgDepth*(1+(P.noise(p.x/w*scaleNoise,p.y/h*scaleNoise)-0.5)*2*varDepth);
    let layer = {depth, color, softness};
    if(!v) v = [];
    v.push(layer);
    return v;
  });
};

LayeredTerrain.prototype.scrape = function(p, s){
  let layers = this.grid.get(p);
  let lastLayer = layers.length-1;
  while(lastLayer > 0 && !layers[lastLayer].depth){
    layers.pop();
    lastLayer--;
  }
  let totalEroded = 0;
  while(lastLayer >= 0){
    let layer = layers[lastLayer--];
    let softness = layer.softness;
    let ns = softness*s;
    if(ns > layer.depth){
      ns -= layer.depth;
      totalEroded += ns;
      if(lastLayer >= 0) layers.pop();
      else layer.depth = 0;
      s = ns/softness;
    }else{
      layer.depth -= ns;
      totalEroded += layer.depth;
      s = 0;
    }
    if(!s) break;
  }
  return totalEroded;
};

LayeredTerrain.prototype.getHeight = function(p){
  return this.grid.get(p).reduce((acc, cur) => acc + cur.depth,0);
};

LayeredTerrain.prototype.toTerrain = function(){
  let terrain = new Terrain({width:this.grid.w,height:this.grid.h});
  let grid = this.grid;
  terrain.applyXY(function(p){
    let layers = grid.get(p);
    let lastLayer = layers.length-1;
    while(lastLayer > 0 && !layers[lastLayer].depth)
      lastLayer--;
    let color = layers[lastLayer].color;
    let height = 0;
    while(lastLayer >= 0)
      height += layers[lastLayer--].depth;
    return {height,color};
  });
  return terrain;
};

function Position(x,y){
  this.xp = x;
  this.yp = y;
  let xi = this.xi = ~~x;
  let yi = this.yi = ~~y;
  this.xf=x-xi;
  this.yf=y-yi;
}

LayeredTerrain.prototype.fillHeightAndGrad = function(pos){
  let isEdgeRight = (pos.xi == this.grid.w-1);
  let isEdgeBottom = (pos.yi == this.grid.h-1);
  let h00=this.getHeight({x:pos.xi,y:pos.yi});
  let h10=isEdgeRight?h00:this.getHeight({x:pos.xi+1,y:pos.yi});
  let h01=isEdgeBottom?h00:this.getHeight({x:pos.xi,y:pos.yi+1});
  let h11=(isEdgeRight?h01:(isEdgeBottom?h10:this.getHeight({x:pos.xi+1,y:pos.yi+1})));
  pos.height=(h00*(1-pos.xf)+h10*pos.xf)*(1-pos.yf) + (h01*(1-pos.xf)+h11*pos.xf)*pos.yf;
  pos.grad={x: h00+h01-h10-h11, y:h00+h10-h01-h11};
  assert(isFinite(pos.xp*pos.yp));
  assert(isFinite(pos.grad.x*pos.grad.y));
};

LayeredTerrain.prototype.genDropletErosion = function(iterations, params){
  let self = this;
  let dft = {
    Kq: 10, // capacity multiply the slope
    Kw: 0.001, // decrease factor of the solution
    Kr: 0.9, // % of erosion
    Kd: 0.02, // % of depot
    Ki: 0.1, // inertia (sort of)
    minSlope: 0.05, // minimum slope
    g: 20, // how the slope influence the speed
  };
  params = Object.assign({},dft,params);
  const Kq=params.Kq !== undefined ? params.Kq : 10;
  const Kw=params.Kw;
  const Kr=params.Kr;
  const Kd=params.Kd;
  const Ki=params.Ki;
  const minSlope = params.minSlope;
  const Kg = params.g*2;
  const width = this.grid.w;
  const height = this.grid.h;
  const maxPathLength = Math.floor(Math.sqrt(width*height)*4);
  const eps = 10e-6;

  function isInLimit(p){
    return !(p.x < 0 || p.x >= width || p.y < 0 || p.y >= height);
  }

  let deposit = function(pos, ds){
    /*let xi = pos.xi, yi = pos.yi;
    let xf = pos.xf, yf = pos.yf;
    let pts = [
      {x:xi  , y:yi  , w:(1-xf)*(1-yf)},
      {x:xi+1, y:yi  , w:   xf *(1-yf)},
      {x:xi  , y:yi+1, w:(1-xf)*   yf },
      {x:xi+1, y:yi+1, w:   xf *   yf }
    ];
    pts.forEach(function(p){
      if(!isInLimit(p)) return;
      let delta = ds*p.w;
      self.addXY(p.x, p.y, delta);
      params.deposit(scolor, self.getColor(p), delta, p);
    });*/
    pos.height += ds;
  };

  let erode = function(pos, ds){
    assert(isFinite(ds));
    let xi = pos.xi, yi = pos.yi;
    let xp = pos.xp, yp = pos.yp;
    let pts = [];
    for(let y=yi-1; y<=yi+2; ++y){
      let yo=y-yp;
      let yo2=yo*yo;

      for(let x=xi-1; x<=xi+2; ++x){
        let xo=x-xp;
        let w=1-(xo*xo+yo2)*0.25;
        if (w<=0) continue;
        w*=0.1591549430918953; // 1/(2*PI)
        pts.push({x,y,w});
      }
    }
    let realDelta = 0;
    pts.forEach(function(p){
      if(!isInLimit(p)) return;
      let delta=ds*p.w;
      realDelta += self.scrape(p, delta);
    });
    assert(isFinite(realDelta));
    return realDelta;
  };

  let longPaths=0, randomDirs=0, sumLen=0;
  for(let iter=0; iter<iterations; ++iter){
    if((iter % 100)===0 && iter!==0) console.log("Calculating erosion: " + (100*iter/iterations).toFixed(0) + "%");

    let pos = new Position(Math.random()*width, Math.random()*height);
    this.fillHeightAndGrad(pos);

    let s=0; // soil carried
    let v=0; // velocity
    let w=1; // decrease at speed (1-Kw)
    let dx=0, dy=0; // direction

    let numMoves=0;
    for (; numMoves<maxPathLength; ++numMoves){
      // calc next pos
      dx=(dx-pos.grad.x)*Ki+pos.grad.x;
      dy=(dy-pos.grad.y)*Ki+pos.grad.y;

      let dl=Math.sqrt(dx*dx+dy*dy);
      if(dl <= eps){
        // pick random dir
        let a=Math.random()*Math.PI*2;
        dx=Math.cos(a);
        dy=Math.sin(a);
        ++randomDirs;
      }else{
        dx/=dl;
        dy/=dl;
      }

      let newPos = new Position(pos.xp+dx, pos.yp+dy);
      if(!isInLimit({x:newPos.xi,y:newPos.yi})){
        deposit(pos, s);
        break;
      }
      this.fillHeightAndGrad(newPos);

      let dh=(pos.height-newPos.height);
      let ds=0; // soil to depose
      if(dh<=0){ // if higher than current, try to deposit sediment up to neighbour height
        ds = -dh+0.001;
        if(ds>=s){ // deposit all sediment and stop
          deposit(pos, s);
          break;
        }
        deposit(pos, ds);
        dh=(pos.height-newPos.height);
        s -= ds;
        v=0;
      }
      let q=Math.max(dh, minSlope)*v*w*Kq; // compute transport capacity
      ds=s-q; // deposit/erode (don't erode more than dh)
      if(ds>=0){ // deposit
        ds*=Kd;
        //deposit(pos, ds);
        //dh+=ds;
        s-=ds;
      }else{ // erode
        ds*=-Kr;
        ds=Math.min(ds, dh*0.99);
        ds=erode(pos, ds);
        //dh-=ds;
        s+=ds;
      }

      let vv = v*v+Kg*dh;
      if(vv < 0){
        console.log(numMoves);
        deposit(pos, s);
        break;
      }
      v=Math.sqrt(vv);
      w*=1-Kw;
      pos = newPos;
    }

    if(numMoves>=maxPathLength)
      ++longPaths;
    sumLen+=numMoves;
  }
};

function draw(layeredTerrain,name,i){
  function pad0(n){ return ("0000"+n).slice(-4); }
  let terrain = layeredTerrain.toTerrain();
  terrain.computeNormal().lightFromNormal(0.5,0.7,sun);
  console.log(msToHuman(),"exporting");
  let filename = name;
  if(i !== undefined) filename += "-" + pad0(i);
  filename += ".png";
  Util.writeImg(terrain.draw(),terrain.width,terrain.height,filename);
}

function erosion(layeredTerrain, nbStep, slopeMultiplier, cb){
  let i = 0;
  let nbDrop = Math.floor(layeredTerrain.grid.w*layeredTerrain.grid.h/50);
  function innerLoop(){
    console.log(msToHuman(),"erosion "+i+"/"+nbStep);
    layeredTerrain.genDropletErosion(nbDrop, {Kq:slopeMultiplier,g:200});
    draw(layeredTerrain,"grandCanyon",i);
    if(++i<nbStep) return setTimeout(innerLoop,0);
    return cb(null,layeredTerrain);
  }
  return innerLoop();
}

let rnd = Math.random;

console.log(msToHuman(),"read gradient");
Gradients.loadingGradients(function(err){
  if(err) return console.log(err);

  let gray = {r:0.5,g:0.5,b:0.5};
  let river = {r:0.2,g:0.5,b:1};
  let red = {r:1,g:0,b:0};
  let green = {r:0,g:1,b:0};
  let layeredTerrain = new LayeredTerrain(512,512);
  let nbLayer = 20; //10
  console.log(msToHuman(),"initial layer");
  layeredTerrain.addLayer(5,0.1, 0.1, river, 0);
  for(let i=0;i<nbLayer;i++){
    console.log(msToHuman(),"additional layer");
    let r = rnd();
    let softness = 1;
    if(r < 0.1) softness = 0.2;
    else if(r < 0.4) softness = 0.2+rnd()*0.8;
    layeredTerrain.addLayer(5,0.001, 0.1, Gradients["grandCanyon"](rnd()), softness);
  }

  draw(layeredTerrain,"grandCanyon");

  erosion(layeredTerrain, 100, 10000, function(){
    console.log(msToHuman(),"transform to terrain");
  });
});
