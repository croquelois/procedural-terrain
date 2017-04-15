/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let type = "park";
let typeId = 4;
let color = {r:0.25,g:0.75,b:0.25};
let behavior = function(){};
module.exports = function(){ return {type,typeId,color,behavior}; };
