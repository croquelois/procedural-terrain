/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";

let Dirs = {};
Dirs.mult = function(d,m){ return {x:m*d.x,y:m*d.y}; };
Dirs.ccw = function(d){ return {x:-d.y,y:d.x}; };
Dirs.cw = function(d){ return {x:d.y,y:-d.x}; };
Dirs.opposite = function(d){ return {x:-d.x,y:-d.y}; };
Dirs.isCart = function(d){ return !d.x || !d.y; };
Dirs.all = [{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0},{x:1,y:1},{x:1,y:-1},{x:-1,y:-1},{x:-1,y:1}];
Dirs.allCart = [{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}];

module.exports = Dirs;
