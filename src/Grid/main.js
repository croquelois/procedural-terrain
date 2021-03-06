/* jshint node:true, undef: true, unused: true, sub:true */
/* exported Grid */

function Grid(w,h){
  this.w = w;
  this.h = h;
  this.data = [];
  if(w > 0 && h > 0){
    for(var y=0;y<h;y++){
      var d = [];
      for(var x=0;x<w;x++) d[x] = null;
      this.data.push(d);
    }
  }
}

Grid.reload = function(data){
  var grid = new Grid(data.w,data.h);
  grid.data = data.data.map(function(line){ return line.slice(); });
  return grid;
};

Grid.prototype.save = function(){
  var obj = {w:this.w,h:this.h};
  obj.data = this.data.map(function(line){ return line.slice(); });
  return obj;
};

Grid.prototype.clone = function(cloneCellFct){
  if(!cloneCellFct) cloneCellFct = function(cell){ return cell; };
  var nGrid = new Grid(this.w,this.h);
  nGrid.data = this.data.map(function(row){ return row.map(cloneCellFct); });
  return nGrid;
};

Grid.prototype.inbound = function(p){
  if(p.x < 0) return false;
  if(p.y < 0) return false;
  if(p.x >= this.w) return false;
  if(p.y >= this.h) return false;
  return true;
};

Grid.prototype.set = function(p,v){
  if(!this.data[p.y]) this.data[p.y] = [];
  this.data[p.y][p.x] = v;
};

Grid.prototype.or = function(p,v){
  if(!this.data[p.y]) this.data[p.y] = [];
  if(this.data[p.y][p.x] === null) this.data[p.y][p.x] = v;
  else this.data[p.y][p.x] |= v;
};

Grid.prototype.andNot = function(p,v){
  if(!this.data[p.y]) this.data[p.y] = [];
  if(this.data[p.y][p.x] === null) this.data[p.y][p.x] = v;
  else this.data[p.y][p.x] &= ~v;
};

Grid.prototype.get = function(p){ return this.data[p.y][p.x]; };

Grid.prototype.has = function(p,i){ return (this.data[p.y][p.x] & i); };

Grid.prototype.each = function(f){
  for(var y=0;y<this.data.length;y++){
    var d = this.data[y];
    for(var x=0;x<d.length;x++) d[x] = f({x,y},d[x]);
  }
  return this;
};

Grid.prototype.fill = function(v){
  if(typeof v == "function") return this.each(v);
  for(var y=0;y<this.data.length;y++){
    var d = this.data[y];
    for(var x=0;x<d.length;x++) d[x] = v;
  }
  return this;
};

Grid.prototype.min = function(p,v){
  var d = this.data[p.y];
  if(!d) d = this.data[p.y] = [];
  var v0 = d[p.x];
  if(v0 === null) d[p.x] = v;
  else d[p.x] = Math.min(v0,v);
};

Grid.prototype.max = function(p,v){
  var d = this.data[p.y];
  if(!d) d = this.data[p.y] = [];
  var v0 = d[p.x];
  if(v0 === null) d[p.x] = v;
  else d[p.x] = Math.max(v0,v);
};

module.exports = Grid;
