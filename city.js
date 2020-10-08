/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
const Terrain = require("Terrain");
const {msToHuman, normalize} = require("./src/Util");
const Exports = require("./src/Exports");
const Gradients = require("./src/CommonGradients");
const Grid = require("Grid");
const CellularAutomata = require("CellularAutomata");

async function main(){
  let nbStep = +(process.argv[2] || 100);
  let inputFile = process.argv[3] || "color.tmp";
  let outputFile = process.argv[4] || "city.tmp";
  inputFile = inputFile.replace(/\.[^\.]+$/, '');
  outputFile = outputFile.replace(/\.[^\.]+$/, '');

  let rnd = Math.random;
  if(process.env["DEV"] == "TRUE"){
    let prng = new (require("Prng"))(42);
    rnd = prng.random.bind(prng);
  }

  function createCity(terrain, cb){
    let width = terrain.width;
    let height = terrain.height;

    let factory = {};
    factory.street = require("./CA_City/street");
    factory.intersection = require("./CA_City/intersection");
    factory.sidewalk = require("./CA_City/sidewalk");
    factory.park = require("./CA_City/park");
    factory.building = require("./CA_City/building");
    factory.water = require("./CA_City/water");
    factory.mountain = require("./CA_City/mountain");

    let grid = new Grid(width,height);
    let atoms = [];
    grid.each(function(p){
      let h = terrain.getHeight(p);
      if(h < 0.50) return factory.water();
      if(h > 0.55) return factory.mountain();
      if(rnd() < 0.0001){
        atoms.push(p);
        return factory.street({x:1,y:0});
      }
      return null;
    });
    
    return new Promise(function(resolve){
      CellularAutomata.runAsync(atoms, grid, factory, nbStep, function(){
        grid.each(function(p,v){
          if(v && v.color) 
            terrain.setColor(p, v.color);
        });
        return resolve(terrain);
      });
    });
  }
  
  console.log(msToHuman(),"load gradients...");
  await Gradients.loadingGradients();
  
  console.log(msToHuman(),"load terrain...");
  let terrain = await Exports.readTerrain(inputFile+".tmp");
  const {width,height} = terrain;
  
  console.log(msToHuman(),"build city...");
  terrain = await createCity(terrain);
  
  console.log(msToHuman(),"exporting...");
  await Exports.writeTerrain(terrain,outputFile+".tmp");
  
  console.log(msToHuman(),"write image...");
  await Exports.writeImage(terrain.draw(),{width,height},outputFile+".png");    
}

main().then(() => console.log("done")).catch((err) => console.log(err));