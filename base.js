/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
const Terrain = require("Terrain");
const {msToHuman, normalize} = require("./src/Util");
const Exports = require("./src/Exports");
const Gradients = require("./src/CommonGradients");

async function main(){
  let size = +process.argv[2] || 512;
  let outputFile = process.argv[3] || "base.tmp";
  let basename = outputFile.replace(/\.[^\.]+$/, '');
  let prng;
  if(process.env["DEV"] == "TRUE")
    prng = new (require("Prng"))(42);
  
  let width = size;
  let height = size;

  let params = {
    powNoise: {nbOctave:6,disturbFactor:0.25,scale:1,mult:10,add:1},
    terrain: {scale:5,mult:2.0,add:0.5},
    water: {nbOctave:6,disturbFactor:0.25,scale:3,mult:-1.0,add:0.3},
  };

  console.log(msToHuman(),"generating perlin noise for power amplification...");
  let powNoise = Terrain.newFromPerlin(width,height,params.powNoise,prng);
  powNoise = powNoise.normalise().mult(params.powNoise.mult).add(params.powNoise.add);

  console.log(msToHuman(),"generating fbm noise for terrain...");
  let terrain = Terrain.newFromFBM(width,height,params.terrain,prng).pow(powNoise);
  powNoise = null;
  terrain = terrain.mult(params.terrain.mult).add(params.terrain.add);

  console.log(msToHuman(),"generating perlin noise for water...");
  let water = Terrain.newFromPerlin(width,height,params.water,prng).mult(params.water.mult).add(params.water.add).minmax(-1,0);

  console.log(msToHuman(),"mixing...");
  terrain = terrain.add(water);
  water = null;

  function drawColoredHeightmap(terrain){
    let sun = normalize({x:0.5,y:0.5,z:-0.5});
    let color = (new Terrain(terrain)).colorFromHeight(Gradients.elevationWithSnow);
    color.computeNormal().setEachNormal((p,h) => h<=0.5?{x:0,y:0,z:1}:null);
    return color.lightFromNormal(0.5,0.7,sun).draw();
  }

  console.log(msToHuman(),"exporting...");
  await Exports.writeTerrain(terrain,basename+".tmp");
  
  console.log(msToHuman(),"drawing...");
  await Gradients.loadingGradients();
  await Exports.writeImage(drawColoredHeightmap(terrain),{width,height},basename+".png");
}

main().then(() => console.log("done")).catch((err) => console.log(err));