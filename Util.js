/* jshint esversion: 6, node:true */
"use strict";
var lwip = require('lwip');
var fs = require('fs');

exports.normalize = function(n){
  let r = 0;
  for(let k in n) r += n[k]*n[k];
  r = Math.sqrt(r);
  for(let k in n) n[k] /= r;
  return n;
};

exports.sqDistance = function(a,b){
  var dx = a.x-b.x;
  var dy = a.y-b.y;
  return dx*dx+dy*dy;
};

exports.distance = function(a,b){
  var dx = a.x-b.x;
  var dy = a.y-b.y;
  return Math.sqrt(dx*dx+dy*dy);
};

exports.sum = function(arr){
  var s = 0;
  for(var i=0;i<arr.length;i++) s+=arr[i];
  return s;
};

function merge(opt, dft) {
  if(opt === undefined) opt = {};
  let ret = {};
  if(typeof(opt) != "object") return opt;
  for(let k in dft){
    if(k in opt) ret[k] = merge(opt[k], dft[k]);
    else ret[k] = dft[k];
  }
  for(let k in opt){
    if(!(k in dft)) ret[k] = opt[k];
  }
  return ret;
}
exports.merge = merge;

let startTime = new Date();
exports.msToHuman = function(ms){
  if(ms === undefined) ms = (new Date()) - startTime;
  let s = Math.floor(ms/1000);
  let m = Math.floor(s/60);
  s -= m*60;
  let h = Math.floor(m/60);
  m -= h*60;
  return "" + h + "H" + ("00"+m).slice(-2) + "m" + ("00"+s).slice(-2) + "s";
};

function pad0(n){ return ("0000"+n).slice(-4); }

exports.writeImg = function(pixels,width,height,filename){
  lwip.open(pixels, {width,height}, function(err,image){
    if(err) return console.log(err);
    image.writeFile(filename, function(err){
        if(err) return console.log(err);
        console.log("success writing the image ("+filename+")");
    });
  });
};

exports.writeTerrain = function(terrain,filename){
  fs.writeFile(filename,terrain.store(),function(err){
    if(err) return console.log(err);
    console.log("success writing the terrain ("+filename+")");
  });
};

exports.distanceSquare2D = function(a,b){
  var dx = a.x-b.x;
  var dy = a.y-b.y;
  return dx*dx+dy*dy;
};


exports.distanceSquare3D = function(a,b){
  var dx = a.x-b.x;
  var dy = a.y-b.y;
  var dz = a.z-b.z;
  return dx*dx+dy*dy+dz*dz;
};

// to use with a 3d world object which contain, inbound, get and each methods
exports.writeObj = function(world,dir,name,n){
  var template = {
       "up": ["--+","-++","+++","+-+"],
     "down": ["---","-+-","++-","+--"],
     "left": ["---","-+-","-++","--+"],
    "right": ["+--","++-","+++","+-+"],
    "front": ["---","+--","+-+","--+"],
     "back": ["-+-","++-","+++","-++"]
  };
  Object.keys(template).forEach(function(k){
    template[k] = template[k].map(function(s){
      var x = (s[0]=="-"?-1:1)/2;
      var y = (s[1]=="-"?-1:1)/2;
      var z = (s[2]=="-"?-1:1)/2;
      return {x,y,z};
    });
  });
  var vertices = [];
  var faces = {};
  function pushFace(p,d,t){
    var tmp = template[d];
    var face = [];
    tmp.forEach(function(m){
      vertices.push({x:p.x+m.x,y:p.y+m.y,z:p.z+m.z});
      face.push(vertices.length);
    });
    if(!faces[t]) faces[t] = [];
    faces[t].push(face);
  }

  function get(p){
    if(!world.inbound(p)) return "Void";
    return world.get(p);
  }

  world.each(function(p,v){
    var x = p.x;
    var y = p.y;
    var z = p.z;
    if(v == "Void") return v;
    var py = (get({x, z, y:y+1}) != "Void");
    var ny = (get({x, z, y:y-1}) != "Void");
    var px = (get({x:x+1, z, y}) != "Void");
    var nx = (get({x:x-1, z, y}) != "Void");
    var pz = (get({x, z:z+1, y}) != "Void");
    var nz = (get({x, z:z-1, y}) != "Void");
    if(!py) pushFace(p,"back",v);
    if(!ny) pushFace(p,"front",v);
    if(!px) pushFace(p,"right",v);
    if(!nx) pushFace(p,"left",v);
    if(!pz) pushFace(p,"up",v);
    if(!nz) pushFace(p,"down",v);
    return v;
  });

  var str = [];
  str.push("mtllib textures.mtl");
  str.push("o test");
  vertices.forEach(function(v){ str.push("v "+[v.x*0.01,v.z*0.01,v.y*0.01].join(" ")); });
  Object.keys(faces).forEach(function(t){
    str.push("g "+t);
    str.push("usemtl "+t);
    faces[t].forEach(function(f){ str.push("f "+f.join(" ")); });
  });
  str = str.join("\n");
  let filename = dir+'/'+name+'-'+pad0(n)+'.obj';
  fs.writeFile(filename,str,function(err){
    if(err) return console.log("Error writing the file '"+filename+"'");
    console.log("File finished: '"+filename+"'");
  });
};

exports.writeObjMemSavy = function(world,dir,name,n){
  var template = {
       "up": ["--+","-++","+++","+-+"],
     "down": ["---","-+-","++-","+--"],
     "left": ["---","-+-","-++","--+"],
    "right": ["+--","++-","+++","+-+"],
    "front": ["---","+--","+-+","--+"],
     "back": ["-+-","++-","+++","-++"]
  };
  Object.keys(template).forEach(function(k){
    template[k] = template[k].map(function(s){
      var x = (s[0]=="-"?-1:1)/2;
      var y = (s[1]=="-"?-1:1)/2;
      var z = (s[2]=="-"?-1:1)/2;
      return {x,y,z};
    });
  });

  let fdV;
  let vIdx = 1;
  function openFileDescriptorVertices(){
    let filenameVertices = dir+'/'+name+'-'+pad0(n)+'-vertices.tmp';
    fdV = fs.openSync(filenameVertices,"w");
    fs.writeSync(fdV, "mtllib textures.mtl"+"\n");
    fs.writeSync(fdV, "o test"+"\n");
  }

  var fdF = {};
  function getFileDescriptorForFacesType(t){
    if(fdF[t] === undefined){
      let filenameFaces = dir+'/'+name+'-'+pad0(n)+'-faces-'+t+'.tmp';
      let fd = fdF[t] = fs.openSync(filenameFaces,"w");
      fs.writeSync(fd,"g "+t+"\n");
      fs.writeSync(fd,"usemtl "+t+"\n");
    }
    return fdF[t];
  }

  function closeAll(){
    fs.closeSync(fdV);
    Object.keys(fdF).forEach(function(t){ fs.closeSync(fdF[t]); });
  }

  function concat(filesIn, fileOut){
    let r = filesIn.map(function(file){ return fs.createReadStream(file); });
    let w = fs.createWriteStream(fileOut);
    let n = filesIn.length;
    function pipe(i){
      if(!r[i]){
        w.end();
        return;
      }
      r[i].pipe(w,{end: false});
      r[i].on('end',function(){
        let nIdx = i+1;
        console.log("file #"+nIdx+" on "+n+" concatened");
        if(nIdx == n) w.end();
        else pipe(nIdx);
      });
    }
    pipe(0);
  }

  function concatIn(fileOut){
    let filenameVertices = dir+'/'+name+'-'+pad0(n)+'-vertices.tmp';
    let filesIn = [filenameVertices].concat(Object.keys(fdF).map(function(t){ return dir+'/'+name+'-'+pad0(n)+'-faces-'+t+'.tmp'; }));
    concat(filesIn,fileOut);
  }

  function pushFace(p,d,t){
    var tmp = template[d];
    var face = [];
    tmp.forEach(function(m){
      let v = {x:p.x+m.x,y:p.y+m.y,z:p.z+m.z};
      fs.writeSync(fdV, "v "+[v.x*0.01,v.z*0.01,v.y*0.01].join(" ")+"\n");
      face.push(vIdx++);
    });
    let fd = getFileDescriptorForFacesType(t);
    fs.writeSync(fd, "f "+face.join(" ")+"\n");
  }

  function get(p){
    if(!world.inbound(p)) return "Void";
    return world.get(p);
  }

  openFileDescriptorVertices();
  console.log("Extract world:");
  let est = world.end.x*world.end.y*world.end.z;
  let updateEst = ~~(est/1000);
  let i = 0;
  world.each(function(p,v){
    i++;
    if((i%updateEst)===0) console.log("progress: "+(100*i/est).toFixed(2)+"%");

    var x = p.x;
    var y = p.y;
    var z = p.z;
    if(v == "Void") return v;
    var py = (get({x, z, y:y+1}) != "Void");
    var ny = (get({x, z, y:y-1}) != "Void");
    var px = (get({x:x+1, z, y}) != "Void");
    var nx = (get({x:x-1, z, y}) != "Void");
    var pz = (get({x, z:z+1, y}) != "Void");
    var nz = (get({x, z:z-1, y}) != "Void");
    if(!py) pushFace(p,"back",v);
    if(!ny) pushFace(p,"front",v);
    if(!px) pushFace(p,"right",v);
    if(!nx) pushFace(p,"left",v);
    if(!pz) pushFace(p,"up",v);
    if(!nz) pushFace(p,"down",v);
    return v;
  });

  console.log("Close part files");
  closeAll();
  console.log("Concatenation");
  let filename = dir+'/'+name+'-'+pad0(n)+'.obj';
  concatIn(filename);
};
