/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";

module.exports = function(Terrain){

  // modif: colors
  // light/shade color based on the normals
  // status: ok
  Terrain.prototype.lightFromNormal = function(ambient,sunPower,sunDirection,eyeDirection){
    let c = this.colors;
    let s = this.speculars;
    let n = this.normals;
    let w = this.width;
    let h = this.height;
    let r,g,b;
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        let i = y*w+x;
        r = c[i].r;
        g = c[i].g;
        b = c[i].b;
        let dot = n[i].x*sunDirection.x + n[i].y*sunDirection.y + n[i].z*sunDirection.z;
        let cosTheta = - dot;
        if(cosTheta > 1) cosTheta = 1;
        if(cosTheta < 0) cosTheta = 0;

        let light = ambient+sunPower*cosTheta;
        r *= light;
        g *= light;
        b *= light;

        if(eyeDirection && s[i]){
          let d = -2*dot;
          let reflection = {};
          reflection.x = sunDirection.x - d*n[i].x;
          reflection.y = sunDirection.y - d*n[i].y;
          reflection.z = sunDirection.z - d*n[i].z;
          let cosAlpha = reflection.x*eyeDirection.x + reflection.y*eyeDirection.y + reflection.z*eyeDirection.z;
          if(cosAlpha > 1) cosAlpha = 1;
          if(cosAlpha < 0) cosAlpha = 0;
          let cosAlphaPow5 = Math.pow(cosAlpha,5);
          r += s[i]*sunPower*cosAlphaPow5;
          g += s[i]*sunPower*cosAlphaPow5;
          b += s[i]*sunPower*cosAlphaPow5;
        }
        if(r>1) r = 1;
        else if(r<0) r = 0;
        if(g>1) g = 1;
        else if(g<0) g = 0;
        if(b>1) b = 1;
        else if(b<0) b = 0;
        c[i] = {r,g,b};
      }
    }
  	return this;
  };

  // modif: colors
  // light/shade color based on heightmap slope
  // status: threatened
  Terrain.prototype.light = function(m,max){
    var p = this.pixels;
    var c = this.colors;
    var w = this.width;
    var h = this.height;
    var i=0;
    var r,g,b;
    for(var y=0;y<h-1;y++){
      for(var x=0;x<w-1;x++,i++){
        r = c[i].r;
        g = c[i].g;
        b = c[i].b;
        var df = (p[i]-p[i+1+w])*m;
        //console.log(df,max);
        if(df > 0){
  				if(df > max) df = max;
          r += df;
          g += df;
          b += df;
          if(r > 1) r = 1;
          if(g > 1) g = 1;
          if(b > 1) b = 1;
          c[i] = {r:r,g:g,b:b};
        }else{
          df = -df;
  				if(df > max) df = max;
          r -= df;
          g -= df;
          b -= df;
          if(r < 0) r = 0;
          if(g < 0) g = 0;
          if(b < 0) b = 0;
          c[i] = {r:r,g:g,b:b};
        }
      }
    }
  	return this;
  };
};
