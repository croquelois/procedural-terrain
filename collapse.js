/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
let fs = require("fs");
let Terrain = require("Terrain");
let Util = require("./Util");
let Gradients = require("./CommonGradients");

let msToHuman = Util.msToHuman;
let normalize = Util.normalize;

let nbStep = +(process.argv[2] || 200);
let inputFile = process.argv[3] || "erosion.tmp";
let outputFile = process.argv[4] || "collapsed.tmp";
inputFile = inputFile.replace(/\.[^\.]+$/, '');
outputFile = outputFile.replace(/\.[^\.]+$/, '');

let rnd = Math.random;
if(process.env["DEV"] == "TRUE"){
  let Prng = require("Prng");
  let prng = new Prng(42);
  rnd = prng.random.bind(prng);
}

Terrain.prototype.removeIsolatedSpike = function(minH,maxH){
  let p = this.pixels;
  let w = this.width;
  let self = this;
  this.applyXY(function(h,x,y){
    let pts = self.getNeighbors({x,y});
    let low = null;
    let high = null;
    pts.forEach(function(pt){
      if(pt.h === undefined) pt.h = p[pt.x+pt.y*w];
      if(!low || low.h > pt.h) low = pt;
      if(!high || high.h < pt.h) high = pt;
    });
    if(h > high.h && high.h <= maxH) return high.h;
    if(h < low.h && low.h >= minH) return low.h;
    return h;
  });
  return this;
};

Terrain.prototype.deposeDust = function(nbPass,amt,isOk,rnd2d,exch){
  let p = this.pixels;
  let h = this.height;
  let w = this.width;
  let self = this;
  let amtIsNum = (typeof amt == "number");
  let size = w*h;
  let n = size*nbPass;
  let action = exch?"collapse":"depose dust";
  for(let i=0;i<n;i++){
    if((i%size) === 0)
      console.log(msToHuman(), action + ": " + ((100*i/n).toFixed(2)) + "%");
    let pt = rnd2d();
    pt.h = p[pt.x+pt.y*w];
    let amount = amt;
    if(!amtIsNum) amount = amt(pt);
    if(!amount) continue;
    let pts = self.getNeighbors(pt,3);
    pts.push(pt);
    let low = null;
    let high = null;
    pts.forEach(function(pt){
      if(pt.h === undefined) pt.h = p[pt.x+pt.y*w];
      if(!isOk(pt)) return;
      if(!low || low.h > pt.h) low = pt;
      if(!high || high.h < pt.h) high = pt;
    });
    if(pt == low || !low || !high)
      continue;
    if(!exch){
      p[low.x+low.y*w] += amount;
    }else{
      let dh = (high.h - low.h)/2;
      if(dh > amount) dh = amount;
      p[low.x+low.y*w] += dh;
      p[pt.x+pt.y*w] += dh;
    }
  }
  return this;
};

function compute(terrain){
  let width = terrain.width;
  let height = terrain.height;
  console.log("size: " + width + "x" + height);
  function rnd2di(){ return {x:~~(width*rnd()),y:~~(height*rnd())}; }

  console.log(msToHuman(),"smoothing...");
  terrain = terrain.max((new Terrain(terrain)).gaussianBlur(5));

  console.log(msToHuman(),"collapsing...");
  let amount = 0.01/nbStep;
  terrain.deposeDust(nbStep,function(p){
    if(p.h < 0.5) return 0;
    if(p.h > 0.6) return 0;
    return amount*(0.6-p.h)/(0.6-0.5);
  },function(p){
    return (p.h <= 0.6);
  },rnd2di,false);

  console.log(msToHuman(),"remove spike...");
  terrain.removeIsolatedSpike(0.5,0.6);

  return terrain;
}

function drawColoredHeightmap(terrain){
  let sun = normalize({x:0.5,y:0.5,z:-0.5});
  let color = (new Terrain(terrain)).colorFromHeight(Gradients.elevationWithSnow);
  color.computeNormal().setEachNormal((p,h) => h<=0.5?{x:0,y:0,z:1}:null);
  return color.lightFromNormal(0.5,0.7,sun).draw();
}

console.log(msToHuman(),"read gradient...");
Gradients.loadingGradients(function(err){
  if(err) return console.log(err);
  console.log(msToHuman(),"read image...");
  fs.readFile(inputFile+".tmp",function(err,data){
    if(err) return console.log(err);
    console.log(msToHuman(),"parse image...");
    let terrain = new Terrain(data);
    console.log(msToHuman(),"erosion...");
    terrain = compute(terrain);
    console.log(msToHuman(),"exporting...");
    Util.writeTerrain(terrain,outputFile+".tmp");
    Util.writeImg(drawColoredHeightmap(terrain),terrain.width,terrain.height,outputFile+".png");
  });
});
