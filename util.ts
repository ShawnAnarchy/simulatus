import * as fs from 'ts-fs'

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
      str = args.map(o=> JSON.stringify(o) ).join(", ");
  fs.writeFileSync(`./logs/${Date.now()}`, "{" + str + "}");
}