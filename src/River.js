/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
const Perlin = require("PerlinSimplex");
const {sigmoidFactory} = require("./Util");

class River {
  constructor(width){
    this.width = width || 0.05;
    let noiseParams = [
      {octave:4, turbulence: 0.25, scale: 10, mult: 2, zeroCenter: true},
      {octave:4, turbulence: 0.25, scale: 10, mult: 0.5},
      {octave:4, turbulence: 0.25, scale: 0.25, mult: 1, add: 15},
    ];
    this.noises = noiseParams.map(param => {
      let {octave, turbulence, scale, mult, add, zeroCenter} = param;
      mult = mult || 1;
      scale = scale || 1;
      add = add || 0;
      let p = new Perlin();
      p.noiseDetail(octave,turbulence);
      if(zeroCenter)
        return (x,y) => add + 2*mult*(p.noise(x*scale,y*scale)-0.5);
      return (x,y) => add + mult*p.noise(x*scale,y*scale);
    });
    this.tributaries = [];
  }
  addTributary(shift, posJoin, converge){
    let river = new River(this.width*0.5);
    let join = sigmoidFactory(posJoin-converge,posJoin);
    this.tributaries.push({shift, join, river});
  }
  getPos(y,t){
    const noises = this.noises;
    let x = 0.5 + this.width*(noises[0](y,t) + noises[1](y,t)*Math.sin(noises[2](y,t)));
    let w = this.width;
    let ret = [{x, w}];
    this.tributaries.forEach(function(tributary){
      let {shift, join, river} = tributary;
      river.getPos(y,t).forEach(function(trib){
        trib.x += shift;
        let a = join(y);
        trib.x = (1-a)*trib.x + a*x;
        ret.push(trib);
      });
    });
    return ret;
  }
}

module.exports = River;