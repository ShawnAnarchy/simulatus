import * as fs from 'fs';
import * as childProcess from 'child_process'
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

export function trace(...args:any[]):void {
  let str:string = "";
  if (args.length > 1) {
    str = args.map(o=> stringify(o) ).join(", ");
    str = "{" + str + "}"
  } else if (args.length === 1) {
    str = stringify(args[0])
  }
  if(str === 'undefined' || str === undefined ) throw new Error('stringify failed')

  let now = Date.now()
  fs.writeFileSync(`./logs/${now}`,  str);
  childProcess.execSync(`cat logs/${now} | jq . > logs/${now}.json && rm logs/${now}`)
}

export function appendRecord(dest:string, key:string, value:number):void {
  let filename = `./frontend/records/${dest}`;
  let record:any = fetchRecord(dest);
  let str = "";
  let obj = {};
  if(Object.keys(record).length > 0){
    record[key] = value;
    str = stringify(record);
  } else {
    obj[key] = value;
    str = stringify(obj);
  }
  fs.writeFileSync(filename, str);
  childProcess.execSync(`cat ${filename} | jq . > ${filename}.json && rm ${filename}`)
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
export function deleteRecord(dest){
  let filename = `./frontend/records/${dest}.json`;
  if(fs.existsSync(filename)){
    fs.writeFileSync(filename, "");
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
  return arr.filter(function(val) { return val !== null; }).join(", ")
}
export function uniq(array) {
  const knownElements = new Set();
  for (const elem of array) {
    knownElements.add(elem); // 同じ値を何度追加しても問題ない
  }
  return Array.from(knownElements);
}