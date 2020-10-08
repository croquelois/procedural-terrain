/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
const Terrain = require("Terrain");
const {msToHuman, normalize, breathing} = require("./src/Util");
const Exports = require("./src/Exports");
const Gradients = require("./src/CommonGradients");

async function main(){
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

  function drawColoredHeightmap(terrain){
    let sun = normalize({x:0.5,y:0.5,z:-0.5});
    let color = (new Terrain(terrain)).colorFromHeight(Gradients.elevationWithSnow);
    color.computeNormal().setEachNormal((p,h) => h<=0.5?{x:0,y:0,z:1}:null);
    return color.lightFromNormal(0.5,0.7,sun).draw();
  }

  console.log(msToHuman(),"load terrain...");
  let terrain = await Exports.readTerrain(inputFile+".tmp");
  const {width,height} = terrain;
  
  console.log(msToHuman(),"erosion...");
  for(let i=0;i<nbStep;i++){
    console.log(msToHuman(),"erosion "+i+"/"+nbStep);
    terrain.genDropletErosion(Math.floor(width*height/50),params.erosion);
    await breathing();
  }
  
  console.log(msToHuman(),"exporting...");
  await Exports.writeTerrain(terrain,outputFile+".tmp");
  
  console.log(msToHuman(),"drawing...");
  await Gradients.loadingGradients();
  await Exports.writeImage(drawColoredHeightmap(terrain),{width,height},outputFile+".png");
}

main().then(() => console.log("done")).catch((err) => console.log(err));