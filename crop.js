/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
const Terrain = require("Terrain");
const {msToHuman, normalize} = require("./src/Util");
const Exports = require("./src/Exports");
const Gradients = require("./src/CommonGradients");

async function main(){
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

  console.log(msToHuman(),"load terrain...");
  let terrain = await Exports.readTerrain(inputFile+".tmp");

  console.log(msToHuman(),"cropping...");
  terrain = terrain.crop(x,y,width,height);

  console.log(msToHuman(),"exporting...");
  await Exports.writeTerrain(terrain,outputFile+".tmp");
  
  console.log(msToHuman(),"drawing...");
  await Gradients.loadingGradients();
  await Exports.writeImage(drawColoredHeightmap(terrain),{width,height},outputFile+".png");
}

main().then(() => console.log("done")).catch((err) => console.log(err));