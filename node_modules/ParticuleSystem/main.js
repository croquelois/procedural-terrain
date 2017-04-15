/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";

let exp = Math.exp;
let sqrt = Math.sqrt;
let floor = Math.floor;
let round = Math.round;
let abs = Math.abs;
let cos = Math.cos;
let sin = Math.sin;
let log = Math.log;
let pi = Math.PI;

// 2d Gaussian random generator
let rnd = (function(random){
  return function(){
    let x, y, r;
    do {
      x = random() * 2 - 1;
      y = random() * 2 - 1;
      r = x * x + y * y;
    } while (!r || r > 1);
    return x * sqrt(-2 * log(r) / r);
  };
})(Math.random);

function ParticuleSystem(sys){
  this.empty = [];
  if(sys === undefined){
    this.pts = [];
  }else{
    this.pts = sys.pts.map(function(elem){
      let n = {};
      for(let k in elem) n[k] = elem[k];
      return n;
    });
  }
}

ParticuleSystem.prototype.init = function(width,height){
  let map = this.map = [];
  let hue = this.hue = [];
  for(let x=0;x<width;x++){
    map[x] = [];
    hue[x] = [];
    for(let y=0;y<height;y++){
      map[x][y] = 0;
      hue[x][y] = 0;
    }
  }
  this.max = 0;
  this.nbPts = 0;
  this.width = width;
  this.height = height;
};

ParticuleSystem.prototype.increase = function(x,y,c){
  let map = this.map;
  let hue = this.hue;
  x = floor(x);
  y = floor(y);
  if(x < 0) return false;
  if(x >= this.width) return false;
  if(y < 0) return false;
  if(y >= this.height) return false;
  let v = ++(map[x][y]);
  if(c) hue[x][y] += c;
  if(this.max < v) this.max = v;
  return true;
};

ParticuleSystem.prototype.wrap = function(e){
  while(e.x < 0) e.x += this.width;
  while(e.x >= this.width) e.x -= this.width;
  while(e.y < 0) e.y += this.height;
  while(e.y >= this.height) e.y -= this.height;
};

ParticuleSystem.prototype.add = function(x,y){
  let elem = {};
  this.pts.push(elem);
  elem.save = this.empty.slice();
  elem.vx = 0;
  elem.vy = 0;
  elem.h = 0;
  if(this.generator){
    this.generator(elem);
  }else{
    elem.x = x;
    elem.y = y;
  }
  elem.sx = elem.x;
  elem.sy = elem.y;
};

ParticuleSystem.prototype.forEach = function(fct){ this.pts.forEach(fct); };

ParticuleSystem.prototype.del = function(){
  this.empty = [];
  this.pts = [];
};

ParticuleSystem.prototype.update = function(){
  let self = this;
  this.forEach(function(elem){
    if(elem.dead) return;
    if(self.tileable) self.wrap(elem);
    if(!self.increase(elem.x, elem.y, elem.h)){
      if(self.generator){
        self.generator(elem);
      }else{
        elem.x = Math.random()*self.width;
        elem.y = Math.random()*self.height;
      }
    }else self.nbPts++;
  });
};

ParticuleSystem.prototype.mapScale = function(l){
  let width = this.width;
  let height = this.height;
  let map = this.map;
  let hue = this.hue;
  for(let x=0;x<width;x++){
    for(let y=0;y<height;y++){
      map[x][y] *= l;
      hue[x][y] *= l;
    }
  }
  this.max *= l;
  this.nbPts *= l;
};

ParticuleSystem.prototype.drawParticules = function(nb,pixels,color){
  let width = this.width;
  let height = this.height;
  let offset = width*height;
  let c = color;
  let pts = this.pts.slice(0,nb);
  pts.forEach(function(e){
    e.save.forEach(function(pt){
      let x = floor(pt.x);
      let y = floor(pt.y);
      let base = x+y*width;
      pixels[base] = c.r;
      pixels[base+1*offset] = c.g;
      pixels[base+2*offset] = c.b;
    });
  });
};

ParticuleSystem.prototype.drawMap = function(pixels,color,background){
  let width = this.width;
  let height = this.height;
  let dvd = this.max; // this.nbPts;
  let offset = width*height;
  for (let i = 0; i < width*height; i++) {
    let x = i%width;
    let y = floor(i/width);
    let m = this.map[x][y];
    if(!m && background){
      pixels[i+0*offset] = background[i+0*offset];
      pixels[i+1*offset] = background[i+1*offset];
      pixels[i+2*offset] = background[i+2*offset];
    }else{
      let v = (dvd > 0 ? m/dvd : 0);
      let h = (m > 0 ? this.hue[x][y]/this.map[x][y] : 0);
      let c = color(v,h);
      pixels[i] = c.r;
      pixels[i+1*offset] = c.g;
      pixels[i+2*offset] = c.b;
    }
  }
  return pixels;
};

ParticuleSystem.prototype.save = function(){
  this.empty.push(null);
  this.forEach(function(elem){
    elem.save.push({x:elem.x,y:elem.y});
  });
};

ParticuleSystem.prototype.load = function(){
  this.empty.shift();
  this.forEach(function(elem){
    let e = elem.save.shift();
    if(!e){
      elem.active = false;
    }else{
      elem.active = true;
      for(let k in e) elem[k] = e[k];
    }
  });
};

ParticuleSystem.prototype.addNoise = function(amount){
  this.forEach(function(elem){
    elem.x += rnd()*amount;
    elem.y += rnd()*amount;
  });
};

ParticuleSystem.prototype.moveRadial = function(distance,direction){
  let pi2 = 2*pi;
  this.forEach(function(e){
    let d = distance.bind?distance(e.x,e.y):distance;
    let v = direction(e.x,e.y);
    e.x += d*cos(v*pi2);
    e.y += d*sin(v*pi2);
  });
};

ParticuleSystem.prototype.move = function(dx,dy){
  let d;
  if(dy === undefined) d = dx;
  else d = function(x,y){ return {x:dx(x,y),y:dy(x,y)}; };
  this.forEach(function(e){
    let n = d(e.x,e.y);
    e.x += n.x;
    e.y += n.y;
  });
};

ParticuleSystem.prototype.moveAccel = function(a){
  let f = 0.9; // friction
  this.forEach(function(e){
    let n = a(e.x,e.y);

    e.vx = e.vx*f + n.x*(1-f);
    e.vy = e.vy*f + n.y*(1-f);
    e.x += e.vx;
    e.y += e.vy;
  });
};

module.exports = ParticuleSystem;
