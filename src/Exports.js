/* jshint esversion: 6, node:true */
"use strict";
const fs = require('fs');
const Jimp = require('jimp');
const Terrain = require("Terrain");

function createImage(size){
  return new Promise(function(resolve, reject){
    new Jimp(size.width, size.height, (err, image) => {
      if(err)
        return reject(err);
      return resolve(image);
    });
  });
}

async function writeImage(pixels, size, filename){
  let image = await createImage(size);
  let {data,height,width} = image.bitmap;
  const offset = width*height;
  for(let y = 0; y < height; y++){
    for(let x = 0; x < width; x++){
        let idx = (width * y + x);
        data[idx*4+0] = pixels[idx+0*offset];
        data[idx*4+1] = pixels[idx+1*offset];
        data[idx*4+2] = pixels[idx+2*offset];
        data[idx*4+3] = 255;
    }
  }
  return image.writeAsync(filename);
}
exports.writeImage = writeImage;

function readTerrain(filename){
  return new Promise(function(resolve, reject){
    fs.readFile(filename,function(err,data){
      if(err)
        return reject(err);
      return resolve(new Terrain(data));
    });
  });
}
exports.readTerrain = readTerrain;

function writeTerrain(terrain,filename){
  return new Promise(function(resolve, reject){
    fs.writeFile(filename,terrain.store(),function(err){
      if(err)
        return reject(err);
      console.log("success writing the terrain ("+filename+")");
      return resolve();
    });
  });
};
exports.writeTerrain = writeTerrain;
