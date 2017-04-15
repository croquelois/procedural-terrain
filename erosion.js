/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let fs = require("fs");
let Terrain = require("Terrain");
let Util = require("./Util");
let Gradients = require("./CommonGradients");

let msToHuman = Util.msToHuman;
let normalize = Util.normalize;

let nbStep = +process.argv[2] || 20;
let inputFile = process.argv[3] || "base.tmp";
let outputFile = process.argv[4] || "erosion.tmp";
inputFile = inputFile.replace(/\.[^\.]+$/, '');
outputFile = outputFile.replace(/\.[^\.]+$/, '');

let params = {
  erosion: {
    Kq: 10, // capacity multiply the slope
    Kw: 0.001, // decrease factor of the solution
    Kr: 0.9, // % of erosion
    Kd: 0.02, // % of depot
    Ki: 0.1, // inertia (sort of)
    minSlope: 0.05, // minimum slope
    g: 20 // how the slope influence the speed
  }
};
params.erosion.deposit = function(depositColor, surfaceColor, soilDeposed, p){ };
params.erosion.erode = function(depositColor, surfaceColor, soilAlreadyCarried, soilJustEroded){ return surfaceColor; };

function erosion(terrain,cb){
  let i = 0;
  function innerLoop(){
    console.log(msToHuman(),"erosion "+i+"/"+nbStep);
    terrain.genDropletErosion(Math.floor(terrain.width*terrain.height/50),params.erosion);
    if(++i<nbStep) return setTimeout(innerLoop,0);
    return cb(null,terrain);
  }
  return innerLoop();
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
    erosion(terrain, function(err,terrain){
      if(err) return console.log(err);
      console.log(msToHuman(),"exporting...");
      Util.writeTerrain(terrain,outputFile+".tmp");
      Util.writeImg(drawColoredHeightmap(terrain),terrain.width,terrain.height,outputFile+".png");
    });
  });
});
