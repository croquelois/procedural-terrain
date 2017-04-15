/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let EventWindow = require("./EventWindow");
let Rand = require("./Rand");

exports.Dirs = require("./Dirs");
exports.EventWindow = EventWindow;
exports.Rand = Rand;
exports.runAsync = function(atoms, grid, factory, nbEpoch, cb){
  let epoch = 0;
  function innerloop(){
    let n = atoms.length*10;
    for(let i=0;i<n;i++){
      let p = Rand.peekList(atoms);
      let atom = grid.get(p);
      if(atom.behavior)
        atom.behavior(new EventWindow(atoms, grid, p), factory);
    }
    epoch++;
    if(epoch == nbEpoch) return cb();
    setTimeout(innerloop,0);
  }
  innerloop();
};
