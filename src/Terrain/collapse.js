/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";

module.exports = function(Terrain){

Terrain.prototype.collapse2pass = function(amt){
  let w = this.width;
  let h = this.height;
  let self = this;

  function onePass(off){
    for(let y=0;y<h;y++){
      for(let x=(y+off)%2;x<w;x+=2){
        let pt = {x,y};
        let pts = self.getNeighbors(pt).concat([pt]);
        let low = null;
        let high = null;
        pts.forEach(function(pt){
          pt.h = self.getHeight(pt);
          if(!low || low.h > pt.h) low = pt;
          if(!high || high.h < pt.h) high = pt;
        });
        if(pt == low) continue;
        let dh = (pt.h - low.h)/2;
        if(dh > amt) dh = amt;
        self.setHeight(low,low.h+dh);
        self.setHeight(pt,pt.h-dh);
      }
    }
  }
  onePass(0);
  onePass(1);
  return this;
};

Terrain.prototype.collapseRnd = function(n,amt,rnd2d){
  let p = this.pixels;
  let w = this.width;
  let self = this;
  let amtIsNum = (typeof amt == "number");
  for(let i=0;i<n;i++){
    let pt = rnd2d();
    pt.h = p[pt.x+pt.y*w];
    let amount = amt;
    if(!amtIsNum) amount = amt(pt);
    if(!amount) continue;
    let pts = self.getNeighbors(pt);
    pts.push(pt);
    let low = null;
    let high = null;
    pts.forEach(function(pt){
      if(pt.h === undefined) pt.h = p[pt.x+pt.y*w];
      if(!low || low.h > pt.h) low = pt;
      if(!high || high.h < pt.h) high = pt;
    });
    if(pt == low) continue;
    let dh = (pt.h - low.h)/2;
    if(dh > amt) dh = amt;
    p[low.x+low.y*w] += dh;
    p[pt.x+pt.y*w] += dh;
  }
  return this;
};

};
