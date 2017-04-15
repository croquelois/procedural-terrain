/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";

module.exports = function(Terrain){

// modif: heights
// average the height, 3x3 constant kernel
// status: ok
Terrain.prototype.smooth = function(){
  var p = this.pixels;
  var np = this.pixels.slice();
  var w = this.width;
  var h = this.height;
  var i=0;
  for(var y=1;y<h-1;y++){
    for(var x=1;x<w-1;x++,i++){
      var v = p[i];
      v += p[i+1];
      v += p[i-1];
      v += p[i-1-w];
      v += p[i-w];
      v += p[i+1-w];
      v += p[i-1+w];
      v += p[i+w];
      v += p[i+1+w];
      np[i] = v/9;
    }
  }
  return this;
};

function boxesForGauss(sigma, n){
    let wIdeal = Math.sqrt((12*sigma*sigma/n)+1);
    let wl = Math.floor(wIdeal);
    if(wl%2===0) wl--;
    let wu = wl+2;
    let mIdeal = (12*sigma*sigma - n*wl*wl - 4*n*wl - 3*n)/(-4*wl - 4);
    let m = Math.round(mIdeal);
    let sizes = [];
    for(let i=0; i<n; i++) sizes.push(i<m?wl:wu);
    return sizes;
}

//from: http://blog.ivank.net/fastest-gaussian-blur.html
function gaussBlur(scl, tcl, w, h, r){
    let bxs = boxesForGauss(r, 3);
    boxBlur(scl, tcl, w, h, (bxs[0]-1)/2);
    boxBlur(tcl, scl, w, h, (bxs[1]-1)/2);
    boxBlur(scl, tcl, w, h, (bxs[2]-1)/2);
}
function boxBlur(scl, tcl, w, h, r){
    for(let i=0; i<scl.length; i++) tcl[i] = scl[i];
    boxBlurH(tcl, scl, w, h, r);
    boxBlurT(scl, tcl, w, h, r);
}
function boxBlurH(scl, tcl, w, h, r){
    let iarr = 1 / (r+r+1);
    for(let i=0; i<h; i++) {
        let ti = i*w, li = ti, ri = ti+r;
        let fv = scl[ti], lv = scl[ti+w-1], val = (r+1)*fv;
        for(let j=0; j<r; j++) val += scl[ti+j];
        for(let j=0  ; j<=r ; j++) { val += scl[ri++] - fv       ;   tcl[ti++] = val*iarr; }
        for(let j=r+1; j<w-r; j++) { val += scl[ri++] - scl[li++];   tcl[ti++] = val*iarr; }
        for(let j=w-r; j<w  ; j++) { val += lv        - scl[li++];   tcl[ti++] = val*iarr; }
    }
}
function boxBlurT(scl, tcl, w, h, r){
    let iarr = 1 / (r+r+1);
    for(let i=0; i<w; i++) {
        let ti = i, li = ti, ri = ti+r*w;
        let fv = scl[ti], lv = scl[ti+w*(h-1)], val = (r+1)*fv;
        for(let j=0; j<r; j++) val += scl[ti+j*w];
        for(let j=0  ; j<=r ; j++) { val += scl[ri] - fv     ;  tcl[ti] = val*iarr;  ri+=w; ti+=w; }
        for(let j=r+1; j<h-r; j++) { val += scl[ri] - scl[li];  tcl[ti] = val*iarr;  li+=w; ri+=w; ti+=w; }
        for(let j=h-r; j<h  ; j++) { val += lv      - scl[li];  tcl[ti] = val*iarr;  li+=w; ti+=w; }
    }
}

Terrain.prototype.gaussianBlur = function(r){
  let scl = this.pixels;
  let tcl = scl.slice();
  gaussBlur(scl,tcl,this.width,this.height,r);
  this.pixels = tcl;
  return this;
};

};
