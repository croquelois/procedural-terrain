/* jshint esversion: 6, node:true */
"use strict";
const PNG = require('pngjs').PNG;
const fs = require('fs');

exports.normalize = function(n){
  let r = 0;
  for(let k in n) r += n[k]*n[k];
  r = Math.sqrt(r);
  for(let k in n) n[k] /= r;
  return n;
};

exports.sqDistance = function(a,b){
  var dx = a.x-b.x;
  var dy = a.y-b.y;
  return dx*dx+dy*dy;
};

exports.distance = function(a,b){
  var dx = a.x-b.x;
  var dy = a.y-b.y;
  return Math.sqrt(dx*dx+dy*dy);
};

exports.sum = function(arr){
  var s = 0;
  for(var i=0;i<arr.length;i++) s+=arr[i];
  return s;
};

function merge(opt, dft) {
  if(opt === undefined) opt = {};
  let ret = {};
  if(typeof(opt) != "object") return opt;
  for(let k in dft){
    if(k in opt) ret[k] = merge(opt[k], dft[k]);
    else ret[k] = dft[k];
  }
  for(let k in opt){
    if(!(k in dft)) ret[k] = opt[k];
  }
  return ret;
}
exports.merge = merge;

let startTime = new Date();
exports.msToHuman = function(ms){
  if(ms === undefined) ms = (new Date()) - startTime;
  let s = Math.floor(ms/1000);
  let m = Math.floor(s/60);
  s -= m*60;
  let h = Math.floor(m/60);
  m -= h*60;
  return "" + h + "H" + ("00"+m).slice(-2) + "m" + ("00"+s).slice(-2) + "s";
};

function pad0(n){ return ("0000"+n).slice(-4); }

exports.distanceSquare2D = function(a,b){
  var dx = a.x-b.x;
  var dy = a.y-b.y;
  return dx*dx+dy*dy;
};

exports.distanceSquare3D = function(a,b){
  var dx = a.x-b.x;
  var dy = a.y-b.y;
  var dz = a.z-b.z;
  return dx*dx+dy*dy+dz*dz;
};

// create a sigmoid function, which take x as an argument
function sigmoidFactory(minX, maxX){
  let invMaxMin = 1/(maxX-minX);
  return function(x){
    let xf = (x-minX)*invMaxMin;
    if(xf > 1)
      return 1;
    if(xf < 0)
      return 0;
    return 0.5+0.5*Math.sin((xf-0.5)*Math.PI);
  };
}
exports.sigmoidFactory = sigmoidFactory;

function getCircle(pos){
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
  return pts;
}
exports.getCircle = getCircle;

// release the thread, and let the interpreter decide what to do next
function breathing(){
  return new Promise(resolve => setTimeout(resolve,0));
}
exports.breathing = breathing;

function sigmoidTest(){
  let sigmoid = sigmoidFactory(100,150);
  let tests = [[0,0],[100,0],[125,0.5],[150,1],[200,1]];
  tests.forEach(test => {
    let [x,y] = test;
    if(sigmoid(x) != y)
      throw new Error(`Expect sigmoid(${x}) == ${y}`);  
  });
}
function circleTest(){
  for(let i=0;i<25;i++){
    let pos = {x:Math.rand(),y:Math.rand()};
    let area = getCircle(pos).reduce((sum,p) => sum+p.w,0);
    console.log("sum of the disk ", pos, area);
  }
}
if(require.main === module){
  sigmoidTest();
  circleTest();
}