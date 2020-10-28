// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
let infile;
let outfile;
let isFront = process.env.NODE_ENV === 'frontend';
let tsObj = {};
let cjsObj = {};

if(isFront){
  infile = './frontend/index.ts'
  outfile = './distfront/index.js'
  tsObj = {lib: ["es5", "dom"], target: "es5", module: "ES2015"};
  cjsObj = { include: [ "./distfront/index.js", "node_modules/**" ]}; 
} else {
  infile = './src/index.ts'
  outfile = './dist/index.js'
}


export default {
  input: infile,
  output: {
    file: outfile,
    sourcemap:true
  },
  treeshake: !isFront,
  format: "cjs",
  plugins: [
    typescript(tsObj),
    commonjs(cjsObj),
    resolve(),
    json()
  ],
};