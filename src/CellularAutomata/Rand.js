/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let rnd = Math.random;
if(process.env["DEV"] == "TRUE"){
  let Prng = require("Prng");
  let prng = new Prng(42);
  rnd = prng.random.bind(prng);
}

let ProbaList = function(){
  this.sum = 0;
  this.proba = [];
  this.items = [];
};
ProbaList.prototype.add = function(items,proba){
  this.sum += proba;
  this.proba.push(proba);
  this.items.push(items);
};
ProbaList.prototype.peek = function(){
  let r = rnd()*this.sum;
  let i = 0;
  do{ r -= this.proba[i++]; }while(r>0);
  return this.items[i-1];
};

let Rand = {};
Rand.oneIn = function(n){ return rnd()*n<1; };
Rand.int = function(n){ return ~~(rnd()*n); };
Rand.peekList = function(list){
  if(!list.length) return;
  return list[Rand.int(list.length)];
};
Rand.ProbaList = ProbaList;
Rand.pos2d = function(){ return {x:rnd(),y:rnd()}; };
Rand.pos2dIntGenerator = function(width,height){
  return function(){
    return {x:~~(width*rnd()),y:~~(height*rnd())};
  };
};
module.exports = Rand;
