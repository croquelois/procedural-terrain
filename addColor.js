/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
const Terrain = require("Terrain");
const {msToHuman, normalize} = require("./src/Util");
const Exports = require("./src/Exports");
const Gradients = require("./src/CommonGradients");

async function main(){
  let inputFile = process.argv[2] || "collapsed.tmp";
  let outputFile = process.argv[3] || "color.tmp";
  inputFile = inputFile.replace(/\.[^\.]+$/, '');
  outputFile = outputFile.replace(/\.[^\.]+$/, '');

  let sun = normalize({x:0.5,y:0.5,z:-0.5});

  console.log(msToHuman(),"load terrain...");
  let terrain = await Exports.readTerrain(inputFile+".tmp");
  const {width,height} = terrain;
  
  console.log(msToHuman(),"draw terrain...");
  await Gradients.loadingGradients();
  terrain.colorFromHeight(Gradients.elevationWithSnow);
  terrain.computeNormal().setEachNormal((p,h) => h<=0.5?{x:0,y:0,z:1}:null);
  terrain.lightFromNormal(0.5,0.7,sun).draw();
  
  console.log(msToHuman(),"exporting...");
  await Exports.writeTerrain(terrain,outputFile+".tmp");
  
  console.log(msToHuman(),"write image...");
  await Exports.writeImage(terrain.draw(),{width,height},outputFile+".png");  
}

main().then(() => console.log("done")).catch((err) => console.log(err));