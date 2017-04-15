/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let Dirs = require("./Dirs");

function EventWindow(atoms, grid, center){
  this.atoms = atoms;
  this.c = center;
  this.grid = grid;
}

EventWindow.prototype.getType = function(p){
  let np = {x:this.c.x+p.x,y:this.c.y+p.y};
  if(!this.grid.inbound(np)) return;
  let atom = this.grid.get(np);
  if(!atom) return "empty";
  return atom.type;
};

EventWindow.prototype.getTypeId = function(p){
  let np = {x:this.c.x+p.x,y:this.c.y+p.y};
  if(!this.grid.inbound(np)) return;
  let atom = this.grid.get(np);
  if(!atom) return 0;
  return atom.typeId;
};

EventWindow.prototype.set = function(p, atom){
  let np = {x:this.c.x+p.x,y:this.c.y+p.y};
  if(!this.grid.inbound(np)) return;
  this.grid.set(np, atom);
  if(!atom.behavior) return;
  this.atoms.push(np);
};

EventWindow.prototype.eachIn = function(radius){
  let ret = [];
  let r2 = radius*radius;
  for(let x=-radius;x<=radius;x++)
    for(let y=-radius;y<=radius;y++)
      if(x*x+y*y < r2)
        ret.push({x,y});
  return ret;
};

EventWindow.prototype.fillIfType = function(d, type, atom){
  if(this.getType(d) == type) this.set(d, atom);
};

EventWindow.prototype.fillIfNotType = function(d, type, atom){
  if(this.getType(d) != type) this.set(d, atom);
};

EventWindow.prototype.mooreBorder = function(type){
  let d = Dirs.all;
  let n = d.length;
  for(let i=0;i<n;i++)
    if(this.getType(d[i]) == type)
      return true;
  return false;
};

EventWindow.prototype.isMooreSurroundedBy = function(types){
  return !Dirs.all.some(d => !types.some(t => this.getType(d) == t));
};

EventWindow.prototype.canSeeElementOfType = function(type, radius){
  return this.eachIn(radius).some(d => this.getType(d) == type);
};

EventWindow.prototype.spiral = function(radius){
  let ret = [];
    let x = 0;
    let y = 0;
    let dx = 0;
    let dy = -1;
    let r = radius;
    let iMax = (2*r+1)*(2*r+1);
    for(let i =0; i < iMax; i++){
        if ((-r <= x) && (x <= r) && (-r <= y) && (y <= r))
            ret.push({x,y});
        if( (x == y) || ((x < 0) && (x == -y)) || ((x > 0) && (x == 1-y))){
            let t = dx;
            dx = -dy;
            dy = t;
        }
        x += dx;
        y += dy;
    }
    return ret;
};

module.exports = EventWindow;
