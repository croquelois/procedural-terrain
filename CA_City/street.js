/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let CA = require("CellularAutomata");
let Dirs = CA.Dirs;
let Rand = CA.Rand;

let intersectionOdds = 20;
let type = "street";
let color = {r:0.25,g:0.25,b:0.25};
let typeId = 1;

function street(d){
  return {type, typeId, color, behavior: behavior.bind(null,d)};
}
module.exports = street;

function behavior(d, window, factory){
  doStreetAndSidewalk(window, factory, d);
  doStreetAndSidewalk(window, factory, Dirs.opposite(d));
  if(!window.mooreBorder("intersection")){
    let ccw = Dirs.ccw(d);
    if(window.getType(ccw) != "sidewalk") window.set(ccw, factory.sidewalk());
    let cw = Dirs.cw(d);
    if(window.getType(cw) != "sidewalk") window.set(cw, factory.sidewalk());
  }
}

function doStreetAndSidewalk(window, factory, d){
  let type = window.getType(d);
  if(type == "empty"){
    if(Rand.oneIn(intersectionOdds) && !window.canSeeElementOfType("intersection",4))
      window.set(d, factory.intersection());
    else
      window.set(d, street(d));
  }

  if(type != "sidewalk") return;

  if(window.getType(Dirs.mult(d,2)) == "intersection"){
    if(type != "street") window.set(d, street(d));
  }else if(window.canSeeElementOfType("intersection",4)){
    window.set({x:0,y:0}, factory.sidewalk());
  }else{
    window.set(Dirs.mult(d,2), factory.intersection());
    if(type != "street") window.set(d, street(d));
  }
}
