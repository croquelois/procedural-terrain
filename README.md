# procedural-terrain
procedural terrain generation

## use

run npm install, the code require async.js, and lwip. Lwip can be difficult to install if your compiler is not installed properly.

```
npm install
```

* there is different script which can be launched, the goal is to ease the development.
* it is useful to use --max_old_space_size=4096 to avoid running out of memory.
* the output files are huge uncompressed data. (2048x2048 take 325mo)
* be reasonable start with 512x512

```
node base.js <size> <output file>
node erosion.js <nb iteration> <input file> <output file>
node collapse.js <nb iteration> <input file> <output file>
node addColor.js <input file> <output file>
node city.js <nb iteration> <input file>
```

## base.js

base.js generate some perlin noise to create the terrain.
![base.png](/base.png)

## erosion.js

erosion.js simulate rain erosion, by simulating drop of water rolling on the terrain.
![erosion.png](/erosion.png)

## collapse.js

collapse.js flatten the terrain between mountain and water
![collapse.png](/collapse.png)

## addColor.js

before calling this script, there is no color inside the .tmp file.

## city.js

before to call this one, be sure to call addColor.js, else everything will be gray.

city.js create city on the part between mountain and water
![city.png](/city.png)
