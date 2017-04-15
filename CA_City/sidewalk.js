/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let CA = require("CellularAutomata");
let Dirs = CA.Dirs;

let type = "sidewalk";
let typeId = 3;
let color = {r:0.75,g:0.75,b:0.75};
let initialTimer = 100;

function doParkBehavior(window, factory){
  if(window.isMooreSurroundedBy(["sidewalk","park"]))
    window.set({x:0,y:0}, factory.park());
}

function doBuildingBehavior(window, factory){
  if(window.mooreBorder("building"))
    return;
  Dirs.all.some(function(p){
    if(window.getType(p) != "empty")
      return false;
    window.set(p, factory.building(p));
    return true;
  });
}

module.exports = function(){
  let timer = initialTimer;
  return {type, typeId, color, behavior: function(window, factory){
    doParkBehavior(window, factory);
    if(!timer) doBuildingBehavior(window, factory);
    else timer--;
  }};
};
