"use strict";
exports.__esModule = true;
exports.stringify = exports.trace = exports.shuffle = void 0;
var fs = require("fs");
var childProcess = require("child_process");
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
    if (args.length > 1) {
        str = args.map(function (o) { return stringify(o); }).join(", ");
        str = "{" + str + "}";
    }
    else if (args.length === 1) {
        str = stringify(args[0]);
    }
    var now = Date.now();
    fs.writeFileSync("./logs/" + now, str);
    childProcess.execSync("cat logs/" + now + " | jq . > logs/" + now + ".json && rm logs/" + now);
}
exports.trace = trace;
function stringify(circ) {
    // Note: cache should not be re-used by repeated calls to JSON.stringify.
    var cache = [];
    var res = JSON.stringify(circ, function (key, value) {
        if (typeof value === 'object' && value !== null) {
            // Duplicate reference found, discard key
            if (cache.includes(value))
                return;
            // Store value in our collection
            cache.push(value);
        }
        return value;
    });
    cache = null; // Enable garbage collection
    return res;
}
exports.stringify = stringify;
