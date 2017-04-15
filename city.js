/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
let fs = require("fs");
let Prng = require("Prng");
let Terrain = require("Terrain");
let Grid = require("Grid");
let Util = require("./Util");
let Gradients = require("./CommonGradients");
let CellularAutomata = require("CellularAutomata");

let msToHuman = Util.msToHuman;
let normalize = Util.normalize;

let nbStep = +(process.argv[2] || 100);
let inputFile = process.argv[3] || "collapsed.tmp";
let outputFile = process.argv[4] || "city.tmp";
inputFile = inputFile.replace(/\.[^\.]+$/, '');
outputFile = outputFile.replace(/\.[^\.]+$/, '');

let rnd = Math.random;
if(process.env["DEV"] == "TRUE"){
  let Prng = require("Prng");
  let prng = new Prng(42);
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
  CellularAutomata.runAsync(atoms, grid, factory, nbStep, function(){
    grid.each(function(p,v){
      if(v && v.color) terrain.setColor(p, v.color);
    });
    return cb(null,terrain);
  });
}

console.log(msToHuman(),"read gradient...");
Gradients.loadingGradients(function(err){
  if(err) return console.log(err);
  console.log(msToHuman(),"read image...");
  fs.readFile(inputFile+".tmp",function(err,data){
    if(err) return console.log(err);
    console.log(msToHuman(),"parse image...");
    let terrain = new Terrain(data);
    console.log(msToHuman(),"build city...");
    createCity(terrain, function(err,terrain){
      if(err) return console.log(err);
      console.log(msToHuman(),"exporting...");
      Util.writeTerrain(terrain,outputFile+".tmp");
      Util.writeImg(terrain.draw(),terrain.width,terrain.height,outputFile+".png");
    });
  });
});
