/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let CA = require("CellularAutomata");
let Dirs = CA.Dirs;
let Rand = CA.Rand;

let streetCreateOdds = 1.5;
let type = "intersection";
let color = {r:0.25,g:0.25,b:0.25};
let typeId = 2;

module.exports = function(){
  let init=false;
  return {type, typeId, color, behavior: function(window,factory){
    if(!init){
      Dirs.all.filter(d => window.getType(d) == "empty").forEach(function(d){
        if(Rand.oneIn(streetCreateOdds) && Dirs.isCart(d)){
          window.set(d, factory.street(d));
        }else{
          window.set(d, factory.sidewalk());
        }
      });
      init = true;
    }
  }};
};
