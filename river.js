/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
const Perlin = require("PerlinSimplex");

const Grid = require("Grid");
const {msToHuman} = require("./src/Util");
const Exports = require("./src/Exports");
const River = require("./src/River.js");

async function main(){
  let size = +process.argv[2] || 512;
  let outputFile = process.argv[3] || "river.tmp";
  outputFile = outputFile.replace(/\.[^\.]+$/, '');
  let width = size;
  let height = size;

  function buildRiver(river, grid){    
    let t = 0;
    const step = 20;
    const dt = 0.01;
    for(let i=0;i<step;i++){
      console.log(msToHuman(), `execute river step ${i}/${step}`);
      let xLows = [];
      for(let y=0;y<height;y++)
        xLows.push(river.getPos(y/height,t));
      
      grid.each(function(p,v){
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
      t = t+=dt;
    }
  }
  
  function draw(grid,name,i){
    function pad0(n){ return ("0000"+n).slice(-4); }
    const width = grid.w;
    const height = grid.h;
    const offset = width*height;
    let pixels = Buffer.alloc(offset*3);
    grid.each(function(p,v){
      let c = 0;
      if(v.isWater)
        c = 255;
      else if(v.wasWater)
        c = 127;
      let i = (p.y*width + p.x);
      pixels[i         ] = c;
      pixels[i+1*offset] = c;
      pixels[i+2*offset] = c;
      return v;
    });
    let filename = name;
    if(i !== undefined) filename += "-" + pad0(i);
    filename += ".png";
    Exports.writeImage(pixels,{width,height},filename);
  }

  let rnd = Math.random;

  console.log(msToHuman(),"create grid");
  let grid = new Grid(width, height);
  grid.fill(() => ({wasWater:false, isWater:false}));
  console.log(msToHuman(),"build river");
  let river = new River();
  river.addTributary(-0.5, 0.5, 0.25);
  river.addTributary(+0.5, 0.75, 0.25);
  buildRiver(river, grid);
  console.log(msToHuman(),"draw");
  draw(grid, outputFile);
}

main().then(() => console.log("done")).catch((err) => console.log(err));