/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";

function Gradient(){
  this.dataPoints = [];
}

function foundLowerBound(set,key,start,end){
  if(set.length === 0) return -1;
  if(start === undefined) start = 0;
  if(end === undefined) end = set.length-1;
  if(start == end) return (start===0&&set[0].position>key?-1:start);
  var mid = Math.ceil((end+start)/2);
  if(set[mid].position < key) return foundLowerBound(set,key,mid,end);
  if(set[mid].position > key) return foundLowerBound(set,key,start,mid-1);
  return mid;
}

Gradient.prototype.scale = function(s){
  this.dataPoints.forEach(d => d.position *= s);
};

Gradient.prototype.shift = function(s){
  this.dataPoints.forEach(d => d.position += s);
};

Gradient.combine = function(g1, g2){
  let g = new Gradient();
  function push(d){ g.dataPoints.push({position:d.position,color:d.color}); }
  g1.dataPoints.forEach(push);
  g2.dataPoints.forEach(push);
  return g;
};

Gradient.prototype.addColorStop = function(position,color){
  this.dataPoints.push({position,color});
  this.dataPoints.sort(function(a,b){ return a.position-b.position; });
};

Gradient.prototype.get = function(position){
  var set = this.dataPoints;
  var idxLow = foundLowerBound(this.dataPoints,position);
  var idxHigh = idxLow + 1;
  if(idxLow == -1) idxLow++;
  if(idxHigh == set.length) idxHigh--;
  var valLow = set[idxLow];
  var valHigh = set[idxHigh];
  if(valHigh.position == valLow.position) return valLow.color;
  var alpha = (valLow.position-position)/(valLow.position-valHigh.position);
  var r = valLow.color.r*(1-alpha)+valHigh.color.r*alpha;
  var g = valLow.color.g*(1-alpha)+valHigh.color.g*alpha;
  var b = valLow.color.b*(1-alpha)+valHigh.color.b*alpha;
  return {r,g,b};
};

module.exports = Gradient;
