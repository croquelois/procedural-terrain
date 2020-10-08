/* jshint esversion:8, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
const Terrain = require("Terrain");
const Perlin = require("PerlinSimplex");
const Grid = require("Grid");
const {msToHuman, normalize, breathing} = require("./src/Util");
const Exports = require("./src/Exports");
const Gradients = require("./src/CommonGradients");
const River = require("./src/River.js");
const LayeredTerrain = require("./src/LayeredTerrain.js");
const assert = require("assert");

const sun = normalize({x:0.5,y:0.5,z:-0.5});
const riverColor = {r:0.2,g:0.5,b:1};

async function main(){
  let size = +process.argv[2] || 512;
  let nbStep = +process.argv[3] || 100;
  let width = size;
  let height = size;

  function draw(layeredTerrain,riverGrid,name,i){
    function pad0(n){ return ("0000"+n).slice(-4); }
    let terrain = layeredTerrain.toTerrain();
    terrain.computeNormal();
    riverGrid.each(function(p,v){
      if(v.isWater){
        terrain.setColor(p, riverColor);
        terrain.setNormal(p, {x:0,y:0,z:1});
      }
      return v;
    });
    terrain.lightFromNormal(0.5,0.7,sun);
    console.log(msToHuman(),"exporting");
    let filename = name;
    if(i !== undefined) filename += "-" + pad0(i);
    filename += ".png";
    const {width, height} = terrain;
    Exports.writeImage(terrain.draw(),{width,height},filename);
  }

  let rnd = Math.random;

  console.log(msToHuman(),"read gradient");
  await Gradients.loadingGradients();
  
  let gray = {r:0.5,g:0.5,b:0.5};
  let red = {r:1,g:0,b:0};
  let green = {r:0,g:1,b:0};
  let sedimentColor = Gradients["desertMojave"](0.80+0.10*rnd());
  let layeredTerrain = new LayeredTerrain(width,height,sedimentColor);
  let nbLayer = 20; //20 or 10
  console.log(msToHuman(),"initial layer");
  layeredTerrain.addLayer(10,0.1, 0.001, layeredTerrain.sedimentColor, 0);
  for(let i=0;i<nbLayer;i++){
    console.log(msToHuman(),"additional layer");
    let r = rnd();
    let softness = 1;
    if(r < 0.2) softness = 0.4;
    else if(r < 0.8) softness = 0.4+rnd()*0.6;
    layeredTerrain.addLayer(5,0.001, 0.1, Gradients["desertMojave"](0.75*softness), softness);
    console.log("layer: "+i+" softness: "+softness);
  }
  layeredTerrain.addLayer(5,0.001, 0.1, Gradients["desertMojave"](0.70+0.10*rnd()), 0.9);
  
  let river = new River(0.01);
  river.addTributary(-0.5, 0.5, 0.25);
  river.addTributary(+0.5, 0.75, 0.25);
  let riverGrid = new Grid(width, height);
  riverGrid.fill(() => ({wasWater:false, isWater:false}));
  
  let t = 0;
  const dt = 0.01;
  let nbDrop = Math.floor(layeredTerrain.grid.w*layeredTerrain.grid.h/50);
  
  draw(layeredTerrain,riverGrid,"grandCanyon/grandCanyon");
  for(let i=0;i<nbStep;i++){
    console.log(msToHuman(), `execute river step ${i}/${nbStep}`);
    let xLows = [];
    for(let y=0;y<height;y++)
      xLows.push(river.getPos(y/height,t));
    
    riverGrid.each(function(p,v){
      if(v.isWater)
        v.wasWater = true;
      v.isWater = false;
      let x = p.x/width;
      xLows[p.y].forEach(function(low){
        let dx = Math.abs(low.x - x);
        if(dx < low.w)
          v.isWater = true;
      });
      return v;
    });
    console.log(msToHuman(), `erosion ${i}/${nbStep}`);
    layeredTerrain.applyRiver(riverGrid);
    layeredTerrain.genDropletErosion(nbDrop, {Kq:10000,g:200});
    let avgH = layeredTerrain.getAvgHeight();
    let minH = layeredTerrain.getMinHeight();
    let maxH = layeredTerrain.getMaxHeight();
    let windHeight = minH + 0.75*(maxH - minH);
    console.log(msToHuman(),"step "+i+"/"+nbStep+""+
      " avg height: "+avgH.toFixed(3)+
      " min height: "+minH.toFixed(3)+
      " max height: "+maxH.toFixed(3)+
      " highWind: "+(0.5*avgH).toFixed(3)
    );
    if(i>0 && i%25 == 0)
      layeredTerrain.highWind(windHeight);
    /*
    console.log(msToHuman(),"step "+i+"/"+nbStep+" average height:"+avgH);*/
    draw(layeredTerrain,riverGrid,"grandCanyon/grandCanyon",i);
    t = t+=dt;
    await breathing();
  }
}

main().then(() => console.log("done")).catch((err) => console.log(err));