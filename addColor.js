/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
let fs = require("fs");
let Terrain = require("Terrain");
let Util = require("./Util");
let Gradients = require("./CommonGradients");

let msToHuman = Util.msToHuman;
let normalize = Util.normalize;

let inputFile = process.argv[2] || "input.tmp";
let outputFile = process.argv[3] || "output.tmp";
inputFile = inputFile.replace(/\.[^\.]+$/, '');
outputFile = outputFile.replace(/\.[^\.]+$/, '');

let sun = normalize({x:0.5,y:0.5,z:-0.5});

console.log(msToHuman(),"read gradient...");
Gradients.loadingGradients(function(err){
  if(err) return console.log(err);
  console.log(msToHuman(),"read image...");
  fs.readFile(inputFile+".tmp",function(err,data){
    if(err) return console.log(err);
    console.log(msToHuman(),"parse image...");
    let terrain = new Terrain(data);
    terrain.colorFromHeight(Gradients.elevationWithSnow);
    terrain.computeNormal().setEachNormal((p,h) => h<=0.5?{x:0,y:0,z:1}:null);
    terrain.lightFromNormal(0.5,0.7,sun).draw();
    console.log(msToHuman(),"exporting...");
    Util.writeTerrain(terrain,outputFile+".tmp");
    Util.writeImg(terrain.draw(),terrain.width,terrain.height,outputFile+".png");
  });
});
