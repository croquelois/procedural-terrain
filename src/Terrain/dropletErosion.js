/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";

module.exports = function(Terrain){

function Position(x,y){
  this.xp = x;
  this.yp = y;
  var xi = this.xi = ~~x;
  var yi = this.yi = ~~y;
  this.xf=x-xi;
  this.yf=y-yi;
}

// modif: null
// take a Position instance and fill it with height and grad
// status: internal
Terrain.prototype.fillHeightAndGrad = function(pos){
  var p = this.pixels;
  var w = this.width;
  var b = pos.xi+pos.yi*w;
  var isEdgeRight = (pos.xi == this.width-1);
  var isEdgeBottom = (pos.yi == this.height-1);
  var h00=p[b];
  var h10=isEdgeRight?h00:p[b+1];
  var h01=isEdgeBottom?h00:p[b+w];
  var h11=(isEdgeRight?h01:(isEdgeBottom?h10:p[b+1+w]));
  pos.height=(h00*(1-pos.xf)+h10*pos.xf)*(1-pos.yf) + (h01*(1-pos.xf)+h11*pos.xf)*pos.yf;
  //assert(isFinite(pos.height),JSON.stringify({h00,h10,h01,h11,pos,b,w}));
  pos.grad={x: h00+h01-h10-h11, y:h00+h10-h01-h11};
};

// modif: height
// simulate erosion, can modify colors and normals if the cb erode/deposite
//  decide to do it
// status: stable
Terrain.prototype.genDropletErosion = function(iterations, params){
  let self = this;
  let dft = {
    Kq: 10, // capacity multiply the slope
    Kw: 0.001, // decrease factor of the solution
    Kr: 0.9, // % of erosion
    Kd: 0.02, // % of depot
    Ki: 0.1, // inertia (sort of)
    minSlope: 0.05, // minimum slope
    g: 20, // how the slope influence the speed
    seaLevel: 0.5, // height at which the erosion stop
    minDropHeight: 0.5, // minimum height at which we drop
  };
  params = Object.assign({},dft,params);
  const Kq=params.Kq !== undefined ? params.Kq : 10;
  const Kw=params.Kw;
  const Kr=params.Kr;
  const Kd=params.Kd;
  const Ki=params.Ki;
  const minSlope = params.minSlope;
  const seaLevel = params.seaLevel;
  const minDropHeight = params.minDropHeight;
  const Kg = params.g*2;
  const width = this.width;
  const height = this.height;
  const maxPathLength = Math.max(width,height)*4;
  const eps = 10e-6;

  let t0 = new Date();
  let elapsedTime = {};
  let lastTimeIveShowMeasure = new Date();

  let wrapMeasure = function(name,th,fct){
    elapsedTime[name] = 0;
    return function(){
      let t0 = new Date();
      fct.apply(th,arguments);
      elapsedTime[name] += (new Date()) - t0;
    };
  };

  let showMeasure = function(){
    let now = new Date();
    if(now - lastTimeIveShowMeasure < 1000) return;
    console.log("Calculating erosion: " + (100*iter/iterations).toFixed(0) + "%");
    Object.keys(elapsedTime).forEach(function(key){
      console.log(key + ":" + (elapsedTime[key]/1000).toFixed(1) + "s");
    });
    console.log("total:" + ((now - t0)/1000).toFixed(1) + "s");
    lastTimeIveShowMeasure = now;
  };

  wrapMeasure = function(name,th,fct){ return fct.bind(th); };
  showMeasure = function(){};

  let fillHeightAndGrad = wrapMeasure("fillHeightAndGrad",this,this.fillHeightAndGrad);

  function isInLimit(p){
    return !(p.x < 0 || p.x >= width || p.y < 0 || p.y >= height);
  }

  let deposit = wrapMeasure("deposit", null, function(pos, ds, scolor){
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
      self.addXY(p.x, p.y, delta);
      params.deposit(scolor, self.getColor(p), delta, p);
    });
    pos.height += ds;
  });

  let erode = wrapMeasure("erode", null, function(pos, ds, s, scolor){
    //assert(isFinite(ds));
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
    pts.forEach(function(p){
      if(!isInLimit(p)) return;
      let delta=ds*p.w;
      self.addXY(p.x, p.y, -delta);
      scolor = params.erode(scolor, self.getColor(p), s, delta);
    });
    return scolor;
  });

  let longPaths=0, randomDirs=0, sumLen=0;

  for(let iter=0; iter<iterations; ++iter){
    showMeasure();
    //if((iter % 1)===0 && iter!==0) console.log("Calculating erosion: " + (100*iter/iterations).toFixed(0) + "%");

    let pos;
    do{
      pos = new Position(Math.random()*this.width, Math.random()*this.height);
      fillHeightAndGrad(pos);
    }while(pos.height < minDropHeight);

    let s=0; // soil carried
    let v=0; // velocity
    let w=1; // decrease at speed (1-Kw)
    let scolor={r:0,g:0,b:0}; // color of the soil carried
    let dx=0, dy=0; // direction

    let numMoves=0;
    for (; numMoves<maxPathLength; ++numMoves){
      showMeasure();
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
        deposit(pos, s, scolor);
        break;
      }
      if(pos.height <= seaLevel){ // break below water
        deposit(pos, s, scolor);
        break;
      }
      fillHeightAndGrad(newPos);

      let dh=(pos.height-newPos.height);
      let ds=0; // soil to depose
      if(dh<=0){ // if higher than current, try to deposit sediment up to neighbour height
        ds = -dh+0.001;
        if(ds>=s){ // deposit all sediment and stop
          deposit(pos, s, scolor);
          break;
        }
        deposit(pos, ds, scolor);
        dh=(pos.height-newPos.height);
        s -= ds;
        v=0;
      }
      let q=Math.max(dh, minSlope)*v*w*Kq; // compute transport capacity
      ds=s-q; // deposit/erode (don't erode more than dh)
      if(ds>=0){ // deposit
        ds*=Kd;
        deposit(pos, ds, scolor);
        dh+=ds;
        s-=ds;
      }else{ // erode
        ds*=-Kr;
        ds=Math.min(ds, dh*0.99);
        scolor = erode(pos, ds, s, scolor);
        dh-=ds;
        s+=ds;
      }

      v=Math.sqrt(v*v+Kg*dh);
      w*=1-Kw;
      pos = newPos;
    }

    if(numMoves>=maxPathLength){
      //console.log("droplet #"+iter+" path is too long!");
      ++longPaths;
    }
    sumLen+=numMoves;
  }

  //let t1 = new Date();
  //console.log("computed "+iterations+" erosion droplets in "+(t1-t0)+" ms, "+iterations*1000/(t1-t0)+" droplets/s");
  //console.log("  "+sumLen/iterations+" average path length, "+longPaths+" long paths cut, "+randomDirs+" random directions picked");
};

// warning: not properly tested
Terrain.prototype.dropOne = function(Ki,approval){
  const width = this.width;
  const height = this.height;
  const maxPathLength = Math.max(width,height)*4;
  const eps = 10e-6;

  function isInLimit(p){
    return !(p.x < 0 || p.x >= width || p.y < 0 || p.y >= height);
  }

  let path = [];
  let pos = approval instanceof Position ? approval : null;
  if(!pos){
    do{
      pos = new Position(Math.random()*this.width, Math.random()*this.height);
      this.fillHeightAndGrad(pos);
    }while(!approval(pos));
  }
  path.push(pos);
  let dx = pos.grad.x;
  let dy = pos.grad.y;

  for (let i=0; i<maxPathLength; ++i){
    dx=(dx-pos.grad.x)*Ki+pos.grad.x;
    dy=(dy-pos.grad.y)*Ki+pos.grad.y;
    let dl=Math.sqrt(dx*dx+dy*dy);
    if(dl <= eps){
      console.log("stale");
      break;
    }

    let newPos = new Position(pos.xp+dx/dl, pos.yp+dy/dl);

    if(!isInLimit({x:newPos.xi,y:newPos.yi})){
      console.log("out of picture");
      break;
    }
    if(pos.height <= 0.5){
      console.log("water");
      break;
    }

    this.fillHeightAndGrad(newPos);
    pos = newPos;
    path.push(pos);
  }
  return path;
};

};
