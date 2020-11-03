import * as fs from 'fs';
import * as childProcess from 'child_process'
import { state } from './lib';
import * as Random from './random'

import {
  TICKING_TIME,
  POPULATION,
  SIMULATE_FOR_DAYS,
  FACILITATORS_INITIAL_HEADCCOUNT,
  PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN,
  SUPREME_JUDGES_INITIAL_HEADCCOUNT,
  UPPERBOUND,
  LOWERBOUND,
  REPRESENTATIVE_HEADCOUNT,
  DEFAULT_DOMAINS,
  PARTICIPATION_THRESHOLD,
  BOTTLENECK_THRESHOLD,
  TUNING,
  DELIBERATION_HEADCOUNT } from './const'

export function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

export function trace(arg:any, filename:any):void {
  let str:string = "";
  str = stringify(arg)
  if(str === 'undefined' || str === undefined ) throw new Error('stringify failed')
  filename = (filename) ? filename : `${Date.now()}`;

  fs.writeFileSync(`logs/${filename}`,  str);
  childProcess.execSync(`cat logs/${filename} | jq . > logs/${filename}.json && rm logs/${filename}`)
}

export function writeRecords(){
  let records = state.get().records;
  let str = "";

  Object.keys(records).map(dest=>{
    let filename = `./frontend/records/${dest}`;
    let record = records[dest];
    str = stringify(record);

    fs.writeFileSync(filename, str);
    childProcess.execSync(`cat ${filename} | jq . > ${filename}.json && rm ${filename}`)
    if (!fs.existsSync(`${filename}.json`)) throw new Error(`${filename}.json cannot be made.`);
  })
}


export function fetchRecord(dest){
  let filename = `./frontend/records/${dest}.json`;
  if(fs.existsSync(filename)){
    let str = fs.readFileSync(filename).toString();
    return str.length > 0 ? JSON.parse(str) : str;
  } else {
    return {}
  }
}
export function deleteRecordAll(){
  let dirname = `./frontend/records`;
  fs.rmdirSync(dirname, {recursive: true});
  fs.mkdirSync(dirname);
}
export function deleteRecord(dest){
  let filename = `./frontend/records/${dest}.json`;
  if(fs.existsSync(filename)){
    fs.writeFileSync(filename, '');
  } else {
  }
}


export function stringify(circ){
  // Note: cache should not be re-used by repeated calls to JSON.stringify.
  var cache = [];
  let count:any = {};
  let res =JSON.stringify(circ, (key, value) => {
    count[key] = 0;
    if (typeof value === 'object' && value !== null) {
      // Duplicate reference found, discard key
      if (cache.includes(value) && count[key] === 0) {
        // add count
        count[key] += 1;
        // Store value in our collection
        cache.push(value);
        return value;
      } else if (cache.includes(value) && count[key] > 0) {
        return;
      } else {
        cache.push(value);
      }
    }
    return value;
  });
  cache = null; // Enable garbage collection
  return res;
}

export function squash(arr){
  return arr.filter(v=>v);
}
export function uniq(array) {
  const knownElements = new Set();
  for (const elem of array) {
    knownElements.add(elem);
  }
  return Array.from(knownElements);
}
export function filterM<T>(jsMapData: Map<string, T>, cb:(key:string, value: T, index:number) => boolean):Map<string, T>{
  let keys:Array<string> = Object.keys(jsMapData);
  let newMap:Map<string, T> = new Map<string, T>();

  keys.filter((key:string,index:number)=>{
    return cb(key, jsMapData[key], index);
  }).map((key:string)=>{
    newMap[key] = jsMapData[key];
  })

  return newMap;
}
export function mapM<T>(jsMapData: Map<string, T>, cb:(key:string, value: T, index:number) => T):Map<string, T>{
  let keys:Array<string> = Object.keys(jsMapData);
  let newMap:Map<string, T> = new Map<string, T>();

  keys.map((key:string,index:number)=>{
    let value:T = cb(key, jsMapData[key], index);
    newMap[key] = value;
    return value;
  })

  return newMap;
}
export function firstM<T>(jsMapData: Map<string, T>): T{
  let keys:Array<string> = Object.keys(jsMapData);
  if(keys.length > 0){
    return jsMapData[keys[0]];
  } else {
    throw new Error('firstM for the empty map.');
  }
}
export function lastM<T>(jsMapData: Map<string, T>): T{
  let keys:Array<string> = Object.keys(jsMapData);
  if(keys.length > 0){
    return jsMapData[keys[keys.length-1]];
  } else {
    throw new Error('lastM for the empty map.');
  }
}
export function keyM<T>(jsMapData: Map<string, T>):string{
  return Object.keys(jsMapData)[0];
}
export function valueM<T>(jsMapData: Map<string, T>):T{
  return jsMapData[keyM(jsMapData)];
}
export function lengthM<T>(jsMapData: Map<string, T>):number{
  return Object.keys(jsMapData).length;
}
export function squashM<T>(jsMapData: Map<string, T>):Map<string, T>{
  return filterM(jsMapData, (k,v)=> !!v );
}
export function sampleM<T>(jsMapData: Map<string, T>, rand=0): T{
  if(rand === 0) {
    rand = Random.number(0, lengthM(jsMapData)-1);
  }
  let key = Object.keys(jsMapData)[rand];
  let value = jsMapData[key];
  return value;
}
export function samplePeople(rand=0): Citizen{
  let s = state.get();
  if(rand === 0) {
    rand = Random.number(0, POPULATION-1);
  }
  let key = s.peopleKeys[rand];
  let value = s.people[key];
  return value;
}
export function multiSampleM<T>(jsMapData: Map<string, T>, n, rands=[0]): Array<T>{
  let len = lengthM(jsMapData) - 1;
  if(rands.length === 1 && rands[0] === 0) {
    for(var i = 0; i < n; i++){
      rands.push(Random.number(0, len));
    }
  }
  let keys = rands.map(rand=> Object.keys(jsMapData)[rand] );
  let values = keys.map(key => jsMapData[key] );
  return values;
}