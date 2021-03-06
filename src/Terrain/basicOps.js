/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let assert = require('assert');

module.exports = function(Terrain){

// modif: heights
// ensure the terrain heights go from 0 to 1
// status: stable
Terrain.prototype.normalise = function(){
  var p = this.pixels;
  var i, l=p.length;
  var v = p[0];
  var min = v;
  var max = v;
  for(i=0;i<l;i++){
    v = p[i];
    if(v > max) max = v;
    if(v < min) min = v;
  }
  var s = 1/(max - min);
  for(i=0;i<l;i++) p[i] = (p[i]-min)*s;
  return this;
};

// modif: heights
// add v to height on the specified position
// status: unstable
Terrain.prototype.addXY = function(x,y,v){
  this.pixels[x+y*this.width] += v;
};

// modif: heights, colors, normals
// if v is a number, modify heights only
// else v is expected to have an attribute height, color or normal
// status: unstable
Terrain.prototype.setXY = function(x,y,v){
  if(typeof v === "number"){
    this.pixels[x+y*this.width] = v;
  }else{
    if(v.height !== undefined) this.pixels[x+y*this.width] = v.height;
    if(v.color) this.colors[x+y*this.width] = v.color;
    if(v.normal) this.normals[x+y*this.width] = v.normal;
  }
};

// modif: heights
// status: stable
Terrain.prototype.setHeight = function(p,h){
  this.pixels[p.x+p.y*this.width] = h;
};

// modif: heights
// the argument is expected to be a number or another terrain
// status: stable
Terrain.prototype.add = function(arg){
  var p = this.pixels;
  var i, l=p.length;

  if(arg.pixels) for(i=0;i<l;i++) p[i] += arg.pixels[i];
  else for(i=0;i<l;i++) p[i] += arg;
  return this;
};

// modif: heights
// the argument is expected to be a number or another terrain
// status: unstable
Terrain.prototype.set = function(arg){
  if(arg.pixels){
    this.width = arg.width;
    this.height = arg.height;
    this.pixels = arg.pixels.slice();
  }else{
    var p = this.pixels;
    for(var i=0;i<p.length;i++) p[i] = arg;
  }
  return this;
};

// modif: null
// return true/false
// status: stable
Terrain.prototype.in = function(x,y){
  return x>=0 && x<this.width && y>=0 && y<=this.height;
};

// modif: null
// return height
// status: unstable
Terrain.prototype.get = function(x,y){
  return this.pixels[x+y*this.width];
};

// modif: null
// return height
// status: stable
Terrain.prototype.getHeight = function(p){
  return this.pixels[p.x+p.y*this.width];
};

// modif: null
// return color
// status: recent signature change from function(x,y) to function(p)
Terrain.prototype.getColor = function(p){
  return this.colors[p.x+p.y*this.width];
};

// modif: colors
// return nothing
// status: new
Terrain.prototype.setColor = function(p, c){
  this.colors[p.x+p.y*this.width] = c;
};

// modif: normals
// return nothing
// status: new
Terrain.prototype.setNormal = function(p, n){
  this.normals[p.x+p.y*this.width] = n;
};

// modif: heights
// the argument is expected to be a number or another terrain
// status: stable
Terrain.prototype.mult = function(arg){
  var p = this.pixels;
  var i, l=p.length;

  if(arg.pixels) for(i=0;i<l;i++) p[i] *= arg.pixels[i];
  else for(i=0;i<l;i++) p[i] *= arg;
  return this;
};

// modif: heights
// the argument is expected to be a number or another terrain
// status: stable
Terrain.prototype.pow = function(arg){
  var p = this.pixels;
  var i, l=p.length;

  if(arg.pixels) for(i=0;i<l;i++) p[i] = Math.pow(p[i],arg.pixels[i]);
  else for(i=0;i<l;i++) p[i] = Math.pow(p[i],arg);
  return this;
};

// modif: heights
// the arguments are expected to be a number
// status: stable
Terrain.prototype.minmax = function(argMin,argMax){
  var min = argMin;
  var max = argMax;
  var p = this.pixels;
  for(var i=0;i<p.length;i++){
    if(p[i] < min) p[i] = min;
    if(p[i] > max) p[i] = max;
  }
  return this;
};

// modif: null
// status: stable
Terrain.prototype.getAvgHeight = function(){
  let m = 0;
  this.pixels.forEach(function(v){ m+=v; });
  return m/this.pixels.length;
};

// modif: null
// status: stable
Terrain.prototype.getMaxHeight = function(){
  let m = this.pixels[0];
  this.pixels.forEach(function(v){ if(v>m) m=v; });
  return m;
};

// modif: null
// status: stable
Terrain.prototype.getMinHeight = function(){
  let m = this.pixels[0];
  this.pixels.forEach(function(v){ if(v<m) m=v; });
  return m;
};

// modif: heights, color, normals
// check the height of both terrain, and keep the information of the heightest
// status: stable
Terrain.prototype.max = function(terrain){
  var p = this.pixels;
  var p2 = terrain.pixels;
  var c = this.colors;
  var c2 = terrain.colors;
  var n = this.normals;
  var n2 = terrain.normals;
  for(var i=0;i<p.length;i++){
    if(p2[i] > p[i]){
      p[i] = p2[i];
      c[i] = c2[i];
      n[i] = n2[i];
    }
  }
  return this;
};

// modif: heights
// compare two terrain and replace the height in the first terrain by the 2nd
//  or 3rd argument depending on which terrain is the heightest
// status: endangered
Terrain.prototype.ifMax = function(terrain,vMaxCur,vMaxNew){
  var p = this.pixels;
  var p2 = terrain.pixels;
  for(var i=0;i<p.length;i++) p[i] = (p[i]>p2[i]?vMaxCur:vMaxNew);
  return this;
};

// modif: heights
// use the heightmap in the mask, if between min and max, use height of the
//  terrain given in argument, else keep the height as it is
// status: endangered
Terrain.prototype.mask = function(terrain,mask,min,max){
  var p = this.pixels;
  var p2 = terrain.pixels;
  var pm = mask.pixels;
  for(var i=0;i<p.length;i++) p[i] = (min<=pm[i]&&pm[i]<max?p2[i]:p[i]);
  return this;
};

// modif: heights
// use the heightmap in the current terrain, if between min and max, replace
//  with height of the terrain given in argument
// the 'what' argument allow to select which field need to be used
// status: unstable
Terrain.prototype.filter = function(terrain,min,max,what){
  let p = this.pixels;
  let s = this.speculars;
  let c = this.colors;
  let n = this.normals;
  let w = this.width;
  let h = this.height;
  let p2 = terrain.pixels;
  let s2 = terrain.speculars;
  let c2 = terrain.colors;
  let n2 = terrain.normals;
  assert(this.width == terrain.width);
  assert(this.height == terrain.height);
  if(!what){
    for(let i=0;i<p.length;i++) p[i] = (min<=p[i]&&p[i]<max?p2[i]:p[i]);
  }else{
    for(let i=0;i<w*h;i++){
      let chg = (min<=p[i]&&p[i]<max);
      if(what.height) p[i] = (chg?p2[i]:p[i]);
      if(what.specular) s[i] = (chg?s2[i]:s[i]);
      if(what.color) c[i] = (chg?c2[i]:c[i]);
      if(what.normal) n[i] = (chg?n2[i]:n[i]);
    }
  }
  return this;
};

// modif: heights
// same than minmax
// status: critically endangered
Terrain.prototype.thresold = function(min, max){
  var p = this.pixels;
  var v,i;
  for(i=0;i<p.length;i++){
    v = p[i];
    if(v < min) v = min;
    else if(v > max) v = max;
    else continue;
    p[i] = v;
  }
  return this;
};

// modif: heights
// round the height of the heightmap using the argument as a step size
// status: ok
Terrain.prototype.round = function(d){
  var p = this.pixels;
  for(var i=0;i<p.length;i++) p[i] = Math.round(p[i]/d)*d;
  return this;
};

// modif: heights
// call the first argument with the current height, and replace the height with
//  the return
// status: threatened
Terrain.prototype.apply = function(fct){
  var p = this.pixels;
  for(var i=0;i<p.length;i++) p[i] = fct(p[i]);
  return this;
};

// modif: heights, colors, normals
// call the first argument with the current height and position
//  if the return is a number, replace the height
//  if the return is undefined or null, do nothing
//  if the return is an object, replace heigh, color or normal
// status: stable
// backward compatibility issue
// 2017-05-02: the callback move from fct(height, x, y) to fct({x,y}, height, color, normal)
Terrain.prototype.applyXY = function(fct){
  let p = this.pixels;
  let c = this.colors;
  let n = this.normals;
  let w = this.width;
  let h = this.height;
  let i=0;
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++,i++){
      let v = fct({x,y},p[i],c[i],n[i]);
      if(v === undefined || v === null) continue;
      if(typeof v == "number"){
        p[i] = v;
      }else{
        if(v.height !== undefined) p[i] = v.height;
        if(v.color) c[i] = v.color;
        if(v.normal) n[i] = v.normal;
      }
    }
  }
  return this;
};

// modif: null
// call the first argument with the current color, height and position
// status: threatened
Terrain.prototype.eachXY = function(fct){
  var c = this.colors;
  var p = this.pixels;
  var w = this.width;
  var h = this.height;
  var i=0;
  for(var y=0;y<h;y++){
    for(var x=0;x<w;x++,i++){
      fct(c[i],p[i],x,y);
    }
  }
  return this;
};


// modif: null
// call the first argument with the current color, height and position
// status: threatened
Terrain.prototype.smoothMinMax = function(minI,minO,maxI,maxO){
  var p = this.pixels;
  let sin = Math.sin;
  let PI = Math.PI;
  for(var i=0;i<p.length;i++){
    let h = p[i];
    if(h < minI) h = minO;
    else if(h > maxI) h = maxO;
    else h = minO+(maxO-minO)*sin(0.5*PI*(h-minI)/(maxI-minI));
    p[i] = h;
  }
  return this;

};

// modif: colors
// call the argument with the height, return is used as color
// status: ok
Terrain.prototype.colorFromHeight = function(mapFct){
  var c = this.colors;
  var p = this.pixels;
  for(var i=0;i<c.length;i++) c[i] = mapFct(p[i]);
  return this;
};

// modif: colors
// fill the whole terrain with the same color passed as argument
// status: ok
Terrain.prototype.color = function(color){
  var c = this.colors;
  for(var i=0;i<c.length;i++) c[i] = color;
  return this;
};

// modif: speculars
// fill the whole terrain with the same specular passed as argument
// status: ok
Terrain.prototype.specular = function(specular){
  var s = this.speculars;
  for(var i=0;i<s.length;i++) s[i] = specular;
  return this;
};

function normalize(n){
  let r = 0;
  for(let k in n) r += n[k]*n[k];
  r = Math.sqrt(r);
  for(let k in n) n[k] /= r;
  return n;
}

// modif: normals
// computee the normals using the heightmap
// status: ok
Terrain.prototype.computeNormal = function(){
  let p = this.pixels;
  let w = this.width;
  let h = this.height;
  let scale = Math.sqrt(w*h);
  for(let y=1;y<h-1;y++){
    for(let x=1;x<w-1;x++){
      let i = y*w+x;
      let n = {x:0,y:0,z:1};
      n.x = scale * -(p[i+1+w]-p[i-1+w]+2*(p[i+1]-p[i-1])+p[i+1-w]-p[i-1-w]);
      n.y = scale * -(p[i-1-w]-p[i-1+w]+2*(p[i-w]-p[i+w])+p[i+1-w]-p[i+1+w]);
      normalize(n);
      this.normals[i] = n;
    }
  }
  return this;
};

// modif: normals
// call the first argument with position and height, use the return as normal
// status: ok
Terrain.prototype.setEachNormal = function(f){
  let p = this.pixels;
  let w = this.width;
  let h = this.height;
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      let i = y*w+x;
      let n = f({x,y},p[i]);
      if(n) this.normals[i] = n;
    }
  }
  return this;
};

Terrain.prototype.getNeighbors = function(p, r){
  let ret = [];
  if(!r){
    if(p.x > 0) ret.push({x:p.x-1,y:p.y});
    if(p.y > 0) ret.push({x:p.x,y:p.y-1});
    if(p.x < this.width-1) ret.push({x:p.x+1,y:p.y});
    if(p.y < this.height-1) ret.push({x:p.x,y:p.y+1});
  }else{
    let r2 = r*r;
    let minx = Math.max(0,p.x-r);
    let maxx = Math.min(this.width-1,p.x+r);
    let miny = Math.max(0,p.y-r);
    let maxy = Math.min(this.height-1,p.y+r);
    for(let x=minx;x<=maxx;x++)
      for(let y=miny;y<=maxy;y++){
        let dx = x-p.x;
        let dy = y-p.y;
        if(!dx && !dy) continue;
        if(dx*dx+dy*dy <= r2)
          ret.push({x,y});
      }
  }
  return ret;
};

Terrain.prototype.crop = function(x,y,width,height){
  let oldWidth = this.width;
  this.width = width;
  this.height = height;
  let oldPixels = this.pixels;
  let oldColors = this.speculars;
  let oldNormals = this.speculars;
  let oldSpeculars = this.speculars;
  this.pixels = [];
  this.colors = [];
  this.normals = [];
  this.speculars = [];
  for(let oy=y;oy<y+height;oy++){
    for(let ox=x;ox<x+width;ox++){
      let oi = oy*oldWidth+ox;
      let i = (oy-y)*width+(ox-x);
      this.pixels[i] = oldPixels[oi];
      this.colors[i] = oldColors[oi];
      this.normals[i] = oldNormals[oi];
      this.speculars[i] = oldSpeculars[oi];
    }
  }
  return this;
};


Terrain.prototype.rndPositionGenerator = function(rnd){
  rnd = rnd || Math.random;
  let w = this.width;
  let h = this.height;
  return function(){
    return {x:~~(rnd()*w), y:~~(rnd()*h)};
  };
};

};
