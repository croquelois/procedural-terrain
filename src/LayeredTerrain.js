/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
const Terrain = require("Terrain");
const Perlin = require("PerlinSimplex");
const {getCircle} = require("./Util");
const Grid = require("Grid");
const assert = require("assert");

function Position(x,y){
  this.xp = x;
  this.yp = y;
  let xi = this.xi = ~~x;
  let yi = this.yi = ~~y;
  this.xf=x-xi;
  this.yf=y-yi;
}

class LayeredTerrain {
  constructor(w,h,sedimentColor){
    this.grid = new Grid(w,h);
    this.grid.each(() => []);
    this.sedimentColor = sedimentColor;
    this.riverGrid = null;
  }
  
  applyRiver(riverGrid){
    this.grid.each(function(p,v){
      v = v || [];
      if(!riverGrid.get(p).isWater)
        return v;
      return [v[0]];
    });
  }
  
  highWind(windHeight){
    let totalEroded = 0;
    this.grid.each(function(p,layers){
      let height = layers.reduce((acc, cur) => acc + cur.depth,0);
      let depth = height - windHeight;
      if(depth <= 0)
        return layers;
      let lastLayer = layers.length-1;
      while(lastLayer > 0){
        let layer = layers[lastLayer];
        
        if(layer.type != "sediment")
          return layers;
        if(layer.depth >= depth){
          layer.depth -= depth;
          totalEroded += depth;
          return layers;
        }
        depth -= layer.depth;
        totalEroded += layer.depth;
        layers.pop();
        lastLayer--;
      }
      return layers;
    });
    console.log("sediment wiped: " + totalEroded);
  }
  
  addRiver(riverGrid, depth, color){
    const softness = 0;
    const type = "river";
    this.riverGrid = riverGrid;
    this.grid.each(function(p,v){
      if(!riverGrid.get(p).isWater)
        return v;
      v.push({depth, color, softness, type});
      return v;
    });
  }
  
  addLayer(scaleNoise, avgDepth, varDepth, color, softness){
    let riverGrid = this.riverGrid;
    let P = new Perlin();
    const {w,h} = this.grid;
    P.noiseDetail(4,0.25);
    this.grid.each(function(p,v){
      v = v || [];
      if(riverGrid){
        let river = riverGrid.get(p);
        if(river.isWater)
          return v;
        if(river.wasWater && softness > 0)
          return v;
      }
      let depth = avgDepth*(1+(P.noise(p.x/w*scaleNoise,p.y/h*scaleNoise)-0.5)*2*varDepth);
      v.push({depth, color, softness});
      return v;
    });
  }
  
  addXY(p, s, color, type, softness){
    let layers = this.grid.get(p);
    let lastLayer = layers.length-1;
    while(lastLayer > 0 && !layers[lastLayer].depth){
      layers.pop();
      lastLayer--;
    }
    let layer = layers[lastLayer];
    if(layer.type == "river")
      return;
    if(layer.type != type){
      layer = {depth:0, color, softness, type};
      layers.push(layer);
    }
    layer.depth += s;
  }
  
  scrape(p, s){
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
        totalEroded += layer.depth;
        layer.depth = 0;
        if(lastLayer >= 0) 
          layers.pop();
        s = ns/softness;
      }else{
        layer.depth -= ns;
        totalEroded += ns;
        s = 0;
      }
      if(!s) break;
    }
    return totalEroded;
  }

  getHeight(p){
    return this.grid.get(p).reduce((acc, cur) => acc + cur.depth,0);
  }

  toTerrain(){
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
  }

  fillHeightAndGrad(pos){
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
  }

  genDropletErosion(iterations, params){
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
      let xi = pos.xi, yi = pos.yi;
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
        self.addXY(p, delta, self.sedimentColor, "sediment", 1);
      });
      pos.height += ds;
    };
    
    let erode = function(pos, ds){
      assert(isFinite(ds));
      let realDelta = 0;
      getCircle(pos).forEach(function(p){
        if(!isInLimit(p)) return;
        let delta=ds*p.w;
        let scraped = self.scrape(p, delta);
        //console.log("ask for:" + delta.toFixed(5) + " received:" + scraped.toFixed(5));
        realDelta += scraped;
      });
      assert(isFinite(realDelta));
      return realDelta;
    };

    let longPaths=0, randomDirs=0, sumLen=0;
    for(let iter=0; iter<iterations; ++iter){
      //console.log("new path");
      //if((iter % 100)===0 && iter!==0) console.log("Calculating erosion: " + (100*iter/iterations).toFixed(0) + "%");

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
          ds = -dh/*+0.001*/;
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
          if(s < 0)
            s = 0;
        }else{ // erode
          ds*=-Kr;
          ds=Math.min(ds, dh*0.99);
          ds=erode(pos, ds);
          //dh-=ds;
          s+=ds;
        }

        let vv = v*v+Kg*dh;
        if(vv < 0){
          //console.log(numMoves);
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
  }
  
  getAvgHeight(){
    let m = 0;
    let {w,h} = this.grid;
    this.grid.each((p,v) => { 
      m += this.getHeight(p);
      return v;
    });
    return m/(w*h);
  }
  
  getMinHeight(){
    let m = this.getHeight({x:0,y:0});
    let {w,h} = this.grid;
    this.grid.each((p,v) => {
      let ph = this.getHeight(p);
      if(m > ph)
        m = ph;
      return v;
    });
    return m;
  }
  
  getMaxHeight(){
    let m = this.getHeight({x:0,y:0});
    let {w,h} = this.grid;
    this.grid.each((p,v) => {
      let ph = this.getHeight(p);
      if(m < ph)
        m = ph;
      return v;
    });
    return m;
  }
}

module.exports = LayeredTerrain;