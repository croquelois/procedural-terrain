/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let CA = require("CellularAutomata");
let Grid = require("Grid");
let Dirs = CA.Dirs;
let Rand = CA.Rand;
let type = "building";
let typeId = 5;

// hopital: 5x5 square white with red cross
// church: 4x3 cross brown
// house: 3x2 rectangle, red roof
// tower: 3x3 square, gray roof
//

let white = {r:1,g:1,b:1};
let black = {r:0,g:0,b:0};
let red   = {r:1,g:0,b:0};
let green = {r:0,g:1,b:0};
let darkgray   = {r:0.25,g:0.25,b:0.25};
let gray       = {r:0.50,g:0.50,b:0.50};
let lightgray  = {r:0.75,g:0.75,b:0.75};
let wood       = {r:0.40,g:0.20,b:0.00};
let redRoof    = {r:0.71,g:0.13,b:0.13};
let blueRoof   = {r:0.13,g:0.13,b:0.41};
let buildingTypes = [
  {type:"redHouse",proba:10,colors:{R:redRoof,G:lightgray},entry:{x:1,y:0},mask:[
    "  G ",
    " RRR",
    " RRR",
    "    ",
  ]},
  {type:"blueHouse",proba:10,colors:{B:blueRoof,G:lightgray},entry:{x:1,y:0},mask:[
    "  G ",
    " BBB",
    " BBB",
    "    ",
  ]},
  {type:"bar",proba:3,colors:{D:darkgray,g:lightgray,G:gray},entry:{x:1,y:0},mask:[
    "     g    ",
    " GGGDDDGGG",
    " GGGDDDGGG",
    "          ",
  ]},
  {type:"hopital",proba:1,colors:{R:red,W:white,B:black},entry:{x:5,y:0},mask:[
    " BBBBBBBBB ",
    " BWWWWWWWB ",
    " BWRWWWRWB ",
    " BWRWWWRWB ",
    " BWRRRRRWB ",
    " BWRWWWRWB ",
    " BWRWWWRWB ",
    " BWWWWWWWB ",
    " BBBBBBBBB ",
    "            ",
  ]},
  {type:"church",proba:1,colors:{B:wood,G:lightgray},entry:{x:5,y:0},mask:[
    "     G     ",
    "    BBB    ",
    "    BBB    ",
    "    BBB    ",
    "    BBB    ",
    "    BBB    ",
    "    BBB    ",
    "    BBB    ",
    " BBBBBBBBB ",
    " BBBBBBBBB ",
    " BBBBBBBBB ",
    "    BBB    ",
    "    BBB    ",
    "    BBB    ",
  ]},
  {type:"mall",proba:1,colors:{B:black,g:lightgray,G:gray},entry:{x:7,y:0},mask:[
    "gggggggggggggg",
    "gggggggggggggg",
    "gggggggggggggg",
    "gggggggggggggg",
    "gggggggggggggg",
    " BBBBBBBBBBBB ",
    " BGGGGGGGGGGB ",
    " BGGGGGGGGGGB ",
    " BGGGGGGGGGGB ",
    " BGGGGGGGGGGB ",
    " BBBBBBBBBBBB ",
    "              ",
  ]},
  {type:"college",proba:1,colors:{R:redRoof,g:lightgray},entry:{x:12,y:0},mask:[
    " RRRRRRRRR  g  ",
    " RRRRRRRRRggggg ",
    " RR     RR gggg ",
    " RR     RR gggg ",
    " RR     RR gggg ",
    " RR     RR gggg ",
    " RR     RR  g   ",
    " RRRRRRRRRRRRRR ",
    " RRRRRRRRRRRRRR ",
    "                ",
  ]}
];

let buildings = new Rand.ProbaList();

buildingTypes.forEach(function(building){
  let mask = building.mask;
  let colors = building.colors;
  let w = mask[0].length;
  let h = mask.length;
  building.grid = (new Grid(w,h)).each(p => colors[mask[p.y][p.x]]);
  buildings.add(building,building.proba);
});

function checkSpace(window, pInit, building){
  let isOk = true;
  let e = building.entry;
  let i = pInit;
  building.grid.each(function(p,color){
    let p2 = {x:i.y*(p.x-e.x)+i.x*(p.y-e.y),y:i.y*(p.y-e.y)+i.x*(p.x-e.x)};
    if(p2.x === 0 && p2.y === 0) return color;
    isOk = isOk && (window.getType(p2) == "empty");
    return color;
  });
  return isOk;
}

function build(window, pInit, building){
  let isOk = true;
  let e = building.entry;
  let i = pInit;
  building.grid.each(function(p,color){
    if(color){
      let p2 = {x:i.y*(p.x-e.x)+i.x*(p.y-e.y),y:i.y*(p.y-e.y)+i.x*(p.x-e.x)};
      window.set(p2,{type, typeId, color});
    }
    return color;
  });
  return isOk;
}

module.exports = function(pInit){
  return {type, typeId, behavior: function(window){
    let building = buildings.peek();
    if(checkSpace(window, pInit, building))
      build(window, pInit, building);
  }};
};
