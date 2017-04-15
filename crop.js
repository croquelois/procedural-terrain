/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
let fs = require("fs");
let Terrain = require("Terrain");
let Util = require("./Util");
let Gradients = require("./CommonGradients");

let msToHuman = Util.msToHuman;
let normalize = Util.normalize;

let x = process.argv[2];
let y = process.argv[3];
let width = process.argv[4];
let height = process.argv[5];
let inputFile = process.argv[6] || "input.tmp";
let outputFile = process.argv[7] || "output.tmp";
inputFile = inputFile.replace(/\.[^\.]+$/, '');
outputFile = outputFile.replace(/\.[^\.]+$/, '');

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
    console.log(msToHuman(),"cropping...");
    terrain = terrain.crop(x,y,width,height);
    console.log(msToHuman(),"exporting...");
    Util.writeTerrain(terrain,outputFile+".tmp");
    Util.writeImg(drawColoredHeightmap(terrain),terrain.width,terrain.height,outputFile+".png");
  });
});
