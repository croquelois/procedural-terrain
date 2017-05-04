/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let Gradient = require("Gradient");
let lwip = require("lwip");
let async = require("async");

function bind(g){ /*console.log(JSON.stringify(g,null,2));*/ return g.get.bind(g); }

function loadingGradientNoBind(filename,cb){
  lwip.open("gradients/" + filename, function(err,image){
    if(err) return cb(err);

    let width = image.width();
    //let height = image.height();

    let gradient = new Gradient();
    for(let x=0;x<width;x++){
      let p = x/(width-1);
      let c = image.getPixel(x, 0);
      gradient.addColorStop(p,{r:c.r/255,g:c.g/255,b:c.b/255});
    }
    return cb(null,gradient);
  });
}

function loadingGradient(filename,cb){
  loadingGradientNoBind(filename, function(err,g){
    if(err) return cb(err);
    return cb(null, bind(g));
  });
}

function loadingAndCombineGradient(file1,file2,cb){
  async.map([file1,file2],loadingGradientNoBind,function(err,gradients){
    if(err) return cb(err);
    gradients[0].scale(0.49999);
    gradients[1].scale(0.50000);
    gradients[1].shift(0.50000);
    return cb(null,bind(Gradient.combine(gradients[0],gradients[1])));
  });
}

exports.loadingGradient = loadingGradient;

exports.loadingGradients = function(cb){
  async.parallel({
    elevationWithSnow: loadingAndCombineGradient.bind(null, "bathymetry12.png", "elevationWithSnow.png"),
    desertMojave: loadingGradient.bind(null, "desertMojave.png"),
    grandCanyon: loadingGradient.bind(null, "grandCanyon.png"),
  },function(err, res){
    if(err) return cb(err);
    exports.elevationWithSnow = res.elevationWithSnow;
    exports.desertMojave = res.desertMojave;
    exports.grandCanyon = res.grandCanyon;
    return cb();
  });
};

let gradient;
gradient = new Gradient();
gradient.addColorStop( 0.0000, {r:0.00, g:0.00, b:0.50}); // deeps
gradient.addColorStop( 0.3750, {r:0.00, g:0.00, b:1.00}); // shallow
gradient.addColorStop( 0.4999, {r:0.00, g:0.50, b:1.00}); // shore
gradient.addColorStop( 0.5000, {r:0.50, g:0.50, b:0.50}); // rock sand
gradient.addColorStop( 0.5625, {r:0.12, g:0.62, b:0.00}); // grass
gradient.addColorStop( 0.6875, {r:0.67, g:0.67, b:0.00}); // dirt
gradient.addColorStop( 0.8750, {r:0.50, g:0.50, b:0.50}); // rock
gradient.addColorStop( 1.0000, {r:1.00, g:1.00, b:1.00}); // snow
exports.terrain = gradient.get.bind(gradient);

gradient = new Gradient();
gradient.addColorStop( 0.0000, {r:0.00, g:0.00, b:0.50}); // deeps
gradient.addColorStop( 0.3750, {r:0.00, g:0.00, b:1.00}); // shallow
gradient.addColorStop( 0.5000, {r:0.00, g:0.50, b:1.00}); // shore
gradient.addColorStop( 0.6875, {r:0.00, g:0.50, b:1.00}); // dirt
gradient.addColorStop( 0.8750, {r:0.00, g:1.00, b:1.00}); // rock
gradient.addColorStop( 1.0000, {r:1.00, g:1.00, b:1.00}); // snow
exports.water = gradient.get.bind(gradient);

gradient = new Gradient();
gradient.addColorStop( 0.0000, {r:0.00, g:0.00, b:0.50}); // deeps
gradient.addColorStop( 0.3750, {r:0.00, g:0.00, b:1.00}); // shallow
gradient.addColorStop( 0.4999, {r:0.00, g:0.50, b:1.00}); // shore
gradient.addColorStop( 0.5000, {r:0.94, g:0.94, b:0.25}); // sand
gradient.addColorStop( 0.5625, {r:0.12, g:0.62, b:0.00}); // grass
gradient.addColorStop( 0.6875, {r:0.12, g:0.62, b:0.00}); // grass
gradient.addColorStop( 1.0000, {r:1.00, g:1.00, b:1.00}); // snow
exports.smoothTerrain = gradient.get.bind(gradient);

gradient = new Gradient();
gradient.addColorStop( 0.0000, {r:1.00, g:0.00, b:0.00}); // red
gradient.addColorStop( 0.9999, {r:1.00, g:0.00, b:0.00}); // red
gradient.addColorStop( 1.0000, {r:0.00, g:0.00, b:0.00}); // black
gradient.addColorStop( 6.0000, {r:1.00, g:1.00, b:1.00}); // white
exports.power = gradient.get.bind(gradient);
gradient = new Gradient();

gradient = new Gradient();
gradient.addColorStop( 0.0000, {r:0.00, g:0.00, b:0.00}); // black
gradient.addColorStop( 1.0000, {r:1.00, g:1.00, b:1.00}); // white
exports.bnw = gradient.get.bind(gradient);

gradient = new Gradient();
gradient.addColorStop( 0.0000, {r:0.00, g:0.00, b:0.00}); // black
gradient.addColorStop( 1.0000, {r:1.00, g:0.00, b:0.00}); // white
gradient.addColorStop( 2.0000, {r:0.00, g:1.00, b:0.00}); // white
gradient.addColorStop( 4.0000, {r:0.00, g:0.00, b:1.00}); // white
gradient.addColorStop( 8.0000, {r:1.00, g:1.00, b:0.00}); // white
gradient.addColorStop( 16.0000, {r:0.00, g:1.00, b:1.00}); // white
gradient.addColorStop( 32.0000, {r:1.00, g:0.00, b:1.00}); // white
gradient.addColorStop( 64.0000, {r:0.50, g:0.50, b:0.50}); // white
gradient.addColorStop( 128.0000, {r:1.00, g:1.00, b:1.00}); // white
exports.loga = gradient.get.bind(gradient);
gradient = new Gradient();

gradient = new Gradient();
gradient.addColorStop( 0.0000, {r:1.00, g:0.75, b:0.5}); // sand
gradient.addColorStop( 0.4000, {r:1.00, g:0.75, b:0.5}); // sand
gradient.addColorStop( 0.4001, {r:1.00, g:0.5, b:0.3}); // sand
gradient.addColorStop( 1.0000, {r:1.00, g:0.5, b:0.3}); // rock
exports.canyon = gradient.get.bind(gradient);

gradient = new Gradient();
gradient.addColorStop( -1.0000, {r:1, g:0, b:0}); // red
gradient.addColorStop(  0.0000, {r:1, g:1, b:1}); // white
gradient.addColorStop(  1.0000, {r:0, g:1, b:0}); // green
exports.redgreen = gradient.get.bind(gradient);
