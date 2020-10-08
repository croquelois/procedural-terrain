/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";

let Terrain = require("./constructors");
require("./basicOps")(Terrain);
require("./inOut")(Terrain);
require("./smooth")(Terrain);
require("./collapse")(Terrain);
require("./lights")(Terrain);
require("./dropletErosion")(Terrain);
module.exports = Terrain;
