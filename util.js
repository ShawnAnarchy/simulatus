"use strict";
exports.__esModule = true;
exports.trace = exports.shuffle = void 0;
var fs = require("ts-fs");
function shuffle(array) {
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
exports.shuffle = shuffle;
function trace() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var str = "";
    if (args.length > 0)
        str = args.map(function (o) { return JSON.stringify(o); }).join(", ");
    fs.writeFileSync("./logs/" + Date.now(), "{" + str + "}");
}
exports.trace = trace;
