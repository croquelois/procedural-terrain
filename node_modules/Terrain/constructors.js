/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let Perlin = require("PerlinSimplex");
let Buffer = require('buffer').Buffer;

function Terrain(arg){
  if(arg instanceof Buffer){
    this.load(arg);
    return;
  }
  this.width = arg.width;
  this.height = arg.height;
  if(arg.pixels){
    this.pixels = arg.pixels.slice();
    this.speculars = arg.speculars.map(n => { return {x:n.x,y:n.y,z:n.z}; });
    this.colors = arg.colors.map(c => { return {r:c.r,g:c.g,b:c.b}; });
    this.normals = arg.normals.map(n => { return {x:n.x,y:n.y,z:n.z}; });
  } else{
    var p = this.pixels = [];
    var s = this.speculars = [];
    var c = this.colors = [];
    var n = this.normals = [];
    var length = this.width*this.height;
    var val = arg.value || 0;
    var col = arg.color || {r:1,g:1,b:1};
    var spec = arg.specular || 0;
    for(var i=0;i<length;i++){
      p[i] = val;
      s[i] = spec;
      c[i] = col;
      n[i] = {x:0,y:0,z:1};
    }
  }
}

// static constructor
// return a new terrain generated from a perlin noise
// status: stable
Terrain.newFromPerlin = function(width,height,params,prng){
  var P = new Perlin();
  if(prng) P.setRng(prng);
  let scl = params.scale || 1;
  let z = params.z || 0;
  P.noiseDetail(params.nbOctave,params.disturbFactor);
  var terrain = new Terrain({width, height});
  terrain.applyXY(function(p){
    return P.noise(p.x/width*scl,p.y/height*scl,z);
  });
  return terrain;
};

// static constructor
// return a new terrain generated from a fbm
// status: new
(function(){
  function addmul(p,q,mp,mq){
    return {x:mp*p.x+mq*q.x,y:mp*p.y+mq*q.y,z:mp*p.z+mq*q.z};
  }
  function EasyPerlin(octave,disturb,prng){
    let P = this.P = new Perlin();
    if(prng) P.setRng(prng);
    P.noiseDetail(octave,disturb);
  }

  EasyPerlin.prototype.noise = function(p){
    return this.P.noise(p.x,p.y,p.z);
  };

  Terrain.newFromFBM = function(width,height,params,prng){
    let Ps = [0,1,2,3,4,5,6];
    Ps = Ps.map(() => new EasyPerlin(5,0,prng));
    let scl = params.scale || 1;
    let z = params.z || 0;
    let s = params.s || 1.5;
    let s2 = params.s2 || 1.5;
    var terrain = new Terrain({width, height});
    terrain.applyXY(function(pt){
      let p = {x:pt.x/width*scl, y:pt.y/height*scl, z:z};
      let q = {x:Ps[1].noise(p),y:Ps[2].noise(p),z:Ps[3].noise(p)};
      let pq = addmul(p, q, 1, s);
      let r = {x:Ps[4].noise(pq),y:Ps[5].noise(pq),z:Ps[6].noise(pq)};
      return Ps[0].noise(addmul(p, r, 1, s2));
    });
    return terrain;
  };
})();

// static constructor
// return a new terrain from the grid given as input
// status: stable
Terrain.newFromGrid = function(grid,what){
  var terrain = new Terrain({width:grid.w, height:grid.h});
  var width = terrain.width;
  var height = terrain.height;
  var pixels = terrain.pixels;

  var i=0,x,y,d;
  if(what){
    for(y=0;y<height;y++){
      d = grid.data[y];
      for(x=0;x<width;x++){
        pixels[i] = d[x][what];
        i++;
      }
    }
  }else{
    for(y=0;y<height;y++){
      d = grid.data[y];
      for(x=0;x<width;x++){
        pixels[i] = d[x];
        i++;
      }
    }
  }
  return terrain;
};

// static constructor
// return a new terrain mixing the two terrains given as input
// status: endangered
Terrain.newFromMix = function(terrain1,terrain2,alpha){
  return ((new Terrain(terrain1)).mult(alpha)).add(((new Terrain(terrain2)).mult(1-alpha)));
};

module.exports = Terrain;
