/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
const {Buffer} = require('buffer');

module.exports = function(Terrain){

  // modif: null
  // return a buffer with a binary serialization of the terrain
  // status: stable
  Terrain.prototype.store = function(){
    let buf = Buffer.alloc(4+4+this.height*this.width*8*(1+3+3+3));
    let noAssert = false;
    let off = 0;
    off = buf.writeInt32LE(this.width, off, noAssert);
    off = buf.writeInt32LE(this.height, off, noAssert);
    for(let i=0;i<this.height*this.width;i++){
      off = buf.writeDoubleLE(this.pixels[i], off, noAssert);
    }
    for(let i=0;i<this.height*this.width;i++){
      let c = this.colors[i];
      off = buf.writeDoubleLE(c.r, off, noAssert);
      off = buf.writeDoubleLE(c.g, off, noAssert);
      off = buf.writeDoubleLE(c.b, off, noAssert);
    }
    for(let i=0;i<this.height*this.width;i++){
      let n = this.normals[i];
      off = buf.writeDoubleLE(n.x, off, noAssert);
      off = buf.writeDoubleLE(n.y, off, noAssert);
      off = buf.writeDoubleLE(n.z, off, noAssert);
    }
    for(let i=0;i<this.height*this.width;i++){
      let n = this.speculars[i];
      off = buf.writeDoubleLE(n.x, off, noAssert);
      off = buf.writeDoubleLE(n.y, off, noAssert);
      off = buf.writeDoubleLE(n.z, off, noAssert);
    }
    return buf;
  };

  // modif: everything
  // deserialization the buffer to recreate the terrain
  // status: stable
  Terrain.prototype.load = function(buf){
    let noAssert = false;
    let off = 0;
    this.width = buf.readInt32LE(off, noAssert); off += 4;
    this.height = buf.readInt32LE(off, noAssert); off += 4;
    this.pixels = [];
    for(let i=0;i<this.height*this.width;i++){
      this.pixels[i] = buf.readDoubleLE(off, noAssert);
      off += 8;
    }
    this.colors = [];
    for(let i=0;i<this.height*this.width;i++){
      let c = {};
      c.r = buf.readDoubleLE(off, noAssert);
      off += 8;
      c.g = buf.readDoubleLE(off, noAssert);
      off += 8;
      c.b = buf.readDoubleLE(off, noAssert);
      off += 8;
      this.colors[i] = c;
    }
    this.normals = [];
    for(let i=0;i<this.height*this.width;i++){
      let n = {};
      n.x = buf.readDoubleLE(off, noAssert);
      off += 8;
      n.y = buf.readDoubleLE(off, noAssert);
      off += 8;
      n.z = buf.readDoubleLE(off, noAssert);
      off += 8;
      this.normals[i] = n;
    }
    this.speculars = [];
    for(let i=0;i<this.height*this.width;i++){
      let n = {};
      n.x = buf.readDoubleLE(off, noAssert);
      off += 8;
      n.y = buf.readDoubleLE(off, noAssert);
      off += 8;
      n.z = buf.readDoubleLE(off, noAssert);
      off += 8;
      this.speculars[i] = n;
    }
    return this;
  };

  // modif: null
  // return a buffer of UINT8 pixels
  // status: stable
  Terrain.prototype.draw = function(pixels){
    var width = this.width;
    var height = this.height;
    var offset = width*height;
    if(!pixels) pixels = Buffer.alloc(offset*3);

    this.eachXY(function(c,h,x,y){
      var i = (y*width + x);
      pixels[i         ] = c.r*255;
      pixels[i+1*offset] = c.g*255;
      pixels[i+2*offset] = c.b*255;
    });
    return pixels;
  };
};
