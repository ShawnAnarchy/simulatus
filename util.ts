import * as fs from 'fs';

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
  if (args.length > 0)
      str = args.map(o=> stringify(o) ).join(", ");
  fs.writeFileSync(`./logs/${Date.now()}`, "{" + str + "}");
}

export function stringify(circ){
  // Note: cache should not be re-used by repeated calls to JSON.stringify.
  var cache = [];
  let res =JSON.stringify(circ, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      // Duplicate reference found, discard key
      if (cache.includes(value)) return;

      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
  cache = null; // Enable garbage collection
  return res;
}