import { randomBytes } from 'crypto';
import FileSystem from 'fs';
import 'child_process';
import Utils from 'util';
import Path from 'path';
import require$$3 from 'os';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

/*!
 * get a random string or number of given range
 * @author isLishude
 * @license MIT
 * @version 2.0.1
 */
var base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
// get a number of given range
function number(min, max) {
    // if the params are not number return zero
    if (typeof min !== "number" || typeof max !== "number") {
        return 0;
    }
    // if number is not in safe range return zero
    if (min < Number.MIN_SAFE_INTEGER || max > Number.MAX_SAFE_INTEGER) {
        return 0;
    }
    // if min param is equal with max param,return min
    return min === max
        ? min
        : Math.floor(Math.random() * (Math.abs(max - min) + 1)) +
            Math.min(max, min);
}
// get uuid by pseudo-random generator
function uuid(length) {
    if (length === void 0) { length = 21; }
    var res = "";
    var random = typeof window === "object"
        ? window.crypto.getRandomValues(new Uint8Array(length))
        : randomBytes(length);
    while (length--) {
        res += base64[random[length] & 0x3f];
    }
    return res;
}

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

function createCommonjsModule(fn, basedir, module) {
	return module = {
		path: basedir,
		exports: {},
		require: function (path, base) {
			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
		}
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

// Create a deferredConfig prototype so that we can check for it when reviewing the configs later.
function DeferredConfig() {}
DeferredConfig.prototype.prepare = function() {};
DeferredConfig.prototype.resolve = function() {};

// Accept a function that we'll use to resolve this value later and return a 'deferred' configuration value to resolve it later.
function deferConfig(func) {
  var obj = Object.create(DeferredConfig.prototype);
  obj.prepare = function(config, prop, property) {
    var original = prop[property]._original;
    obj.resolve = function() {
      var value = func.call(config, config, original);
      Object.defineProperty(prop, property, {value: value});
      return value;
    };
    Object.defineProperty(prop, property, {get: function() { return obj.resolve(); }});
    return obj;
  };
  return obj;
}

var deferConfig_1 = deferConfig;
var DeferredConfig_1 = DeferredConfig;

var defer = {
	deferConfig: deferConfig_1,
	DeferredConfig: DeferredConfig_1
};

/**
 * This is meant to wrap configuration objects that should be left as is,
 * meaning that the object or its protoype will not be modified in any way
 */
function RawConfig () {
}

function raw(rawObj) {
  var obj = Object.create(RawConfig.prototype);
  obj.resolve = function () { return rawObj; };
  return obj;
}

var RawConfig_1 = RawConfig;
var raw_2 = raw;

var raw_1 = {
	RawConfig: RawConfig_1,
	raw: raw_2
};

var parser = createCommonjsModule(function (module) {
// External libraries are lazy-loaded only if these file types exist.
var Yaml = null,
    VisionmediaYaml = null,
    Coffee = null,
    Iced = null,
    CSON = null,
    PPARSER = null,
    JSON5 = null,
    TOML = null,
    HJSON = null,
    XML = null;

// Define soft dependencies so transpilers don't include everything
var COFFEE_2_DEP = 'coffeescript',
    JS_YAML_DEP = 'js-yaml',
    YAML_DEP = 'yaml';

var Parser = module.exports;

Parser.parse = function(filename, content) {
  var parserName = filename.substr(filename.lastIndexOf('.') +1);  // file extension
  if (typeof definitions[parserName] === 'function') {
    return definitions[parserName](filename, content);
  }
  // TODO: decide what to do in case of a missing parser
};

Parser.xmlParser = function(filename, content) {
  if (!XML) {
    XML = commonjsRequire();
  }
  var x2js = new XML();
  var configObject = x2js.xml2js(content);
  var rootKeys = Object.keys(configObject);
  if(rootKeys.length === 1) {
    return configObject[rootKeys[0]];
  }
  return configObject;
};

Parser.jsParser = function(filename, content) {
  return commonjsRequire();
};

Parser.tsParser = function(filename, content) {
  if (!commonjsRequire.extensions['.ts']) {
    commonjsRequire().register({
      lazy: true,
      compilerOptions: {
        allowJs: true,
      }
    });
  }

  // Imports config if it is exported via module.exports = ...
  // See https://github.com/lorenwest/node-config/issues/524
  var configObject = commonjsRequire();

  // Because of ES6 modules usage, `default` is treated as named export (like any other)
  // Therefore config is a value of `default` key.
  if (configObject.default) {
    return configObject.default
  }
  return configObject;
};

Parser.coffeeParser = function(filename, content) {
  // .coffee files can be loaded with either coffee-script or iced-coffee-script.
  // Prefer iced-coffee-script, if it exists.
  // Lazy load the appropriate extension
  if (!Coffee) {
    Coffee = {};

    // The following enables iced-coffee-script on .coffee files, if iced-coffee-script is available.
    // This is commented as per a decision on a pull request.
    //try {
    //  Coffee = require('iced-coffee-script');
    //}
    //catch (e) {
    //  Coffee = require('coffee-script');
    //}
    try {
      // Try to load coffeescript
      Coffee = commonjsRequire(COFFEE_2_DEP);
    }
    catch (e) {
      // If it doesn't exist, try to load it using the deprecated module name
      Coffee = commonjsRequire();
    }
    // coffee-script >= 1.7.0 requires explicit registration for require() to work
    if (Coffee.register) {
      Coffee.register();
    }
  }
  // Use the built-in parser for .coffee files with coffee-script
  return commonjsRequire();
};

Parser.icedParser = function(filename, content) {
  Iced = commonjsRequire();

  // coffee-script >= 1.7.0 requires explicit registration for require() to work
  if (Iced.register) {
    Iced.register();
  }
};

Parser.yamlParser = function(filename, content) {
  if (!Yaml && !VisionmediaYaml) {
    // Lazy loading
    try {
      // Try to load the better js-yaml module
      Yaml = commonjsRequire(JS_YAML_DEP);
    }
    catch (e) {
      try {
        // If it doesn't exist, load the fallback visionmedia yaml module.
        VisionmediaYaml = commonjsRequire(YAML_DEP);
      }
      catch (e) { }
    }
  }
  if (Yaml) {
    return Yaml.load(content);
  }
  else if (VisionmediaYaml) {
    // The yaml library doesn't like strings that have newlines but don't
    // end in a newline: https://github.com/visionmedia/js-yaml/issues/issue/13
    content += '\n';
    return VisionmediaYaml.eval(Parser.stripYamlComments(content));
  }
  else {
    console.error('No YAML parser loaded.  Suggest adding js-yaml dependency to your package.json file.');
  }
};

Parser.jsonParser = function(filename, content) {
  try {
    return JSON.parse(content);
  }
  catch (e) {
    // All JS Style comments will begin with /, so all JSON parse errors that
    // encountered a syntax error will complain about this character.
    if (e.name !== 'SyntaxError' || e.message.indexOf('Unexpected token /') !== 0) {
      throw e;
    }
    if (!JSON5) {
      JSON5 = commonjsRequire();
    }
    return JSON5.parse(content);
  }
};

Parser.json5Parser = function(filename, content) {
  if (!JSON5) {
    JSON5 = commonjsRequire();
  }
  return JSON5.parse(content);
};

Parser.hjsonParser = function(filename, content) {
  if (!HJSON) {
    HJSON = commonjsRequire();
  }
  return HJSON.parse(content);
};

Parser.tomlParser = function(filename, content) {
  if(!TOML) {
    TOML = commonjsRequire();
  }
  return TOML.parse(content);
};

Parser.csonParser = function(filename, content) {
  if (!CSON) {
    CSON = commonjsRequire();
  }
  // Allow comments in CSON files
  if (typeof CSON.parseSync === 'function') {
    return CSON.parseSync(Parser.stripComments(content));
  }
  return CSON.parse(Parser.stripComments(content));
};

Parser.propertiesParser = function(filename, content) {
  if (!PPARSER) {
    PPARSER = commonjsRequire();
  }
  return PPARSER.parse(content, { namespaces: true, variables: true, sections: true });
};

/**
 * Strip all Javascript type comments from the string.
 *
 * The string is usually a file loaded from the O/S, containing
 * newlines and javascript type comments.
 *
 * Thanks to James Padolsey, and all who contributed to this implementation.
 * http://james.padolsey.com/javascript/javascript-comment-removal-revisted/
 *
 * @protected
 * @method stripComments
 * @param fileStr {string} The string to strip comments from
 * @param stringRegex {RegExp} Optional regular expression to match strings that
 *   make up the config file
 * @return {string} The string with comments stripped.
 */
Parser.stripComments = function(fileStr, stringRegex) {
  stringRegex = stringRegex || /(['"])(\\\1|.)+?\1/g;

  var uid = '_' + +new Date(),
    primitives = [],
    primIndex = 0;

  return (
    fileStr

    /* Remove strings */
      .replace(stringRegex, function(match){
        primitives[primIndex] = match;
        return (uid + '') + primIndex++;
      })

      /* Remove Regexes */
      .replace(/([^\/])(\/(?!\*|\/)(\\\/|.)+?\/[gim]{0,3})/g, function(match, $1, $2){
        primitives[primIndex] = $2;
        return $1 + (uid + '') + primIndex++;
      })

      /*
      - Remove single-line comments that contain would-be multi-line delimiters
          E.g. // Comment /* <--
      - Remove multi-line comments that contain would be single-line delimiters
          E.g. /* // <--
     */
      .replace(/\/\/.*?\/?\*.+?(?=\n|\r|$)|\/\*[\s\S]*?\/\/[\s\S]*?\*\//g, '')

      /*
      Remove single and multi-line comments,
      no consideration of inner-contents
     */
      .replace(/\/\/.+?(?=\n|\r|$)|\/\*[\s\S]+?\*\//g, '')

      /*
      Remove multi-line comments that have a replaced ending (string/regex)
      Greedy, so no inner strings/regexes will stop it.
     */
      .replace(RegExp('\\/\\*[\\s\\S]+' + uid + '\\d+', 'g'), '')

      /* Bring back strings & regexes */
      .replace(RegExp(uid + '(\\d+)', 'g'), function(match, n){
        return primitives[n];
      })
  );

};

/**
 * Strip YAML comments from the string
 *
 * The 2.0 yaml parser doesn't allow comment-only or blank lines.  Strip them.
 *
 * @protected
 * @method stripYamlComments
 * @param fileStr {string} The string to strip comments from
 * @return {string} The string with comments stripped.
 */
Parser.stripYamlComments = function(fileStr) {
  // First replace removes comment-only lines
  // Second replace removes blank lines
  return fileStr.replace(/^\s*#.*/mg,'').replace(/^\s*[\n|\r]+/mg,'');
};

/**
 * Parses the environment variable to the boolean equivalent.
 * Defaults to false
 *
 * @param {String} content - Environment variable value
 * @return {boolean} - Boolean value fo the passed variable value
 */
Parser.booleanParser = function(filename, content) {
  return content === 'true';
};

/**
 * Parses the environment variable to the number equivalent.
 * Defaults to undefined
 *
 * @param {String} content - Environment variable value
 * @return {Number} - Number value fo the passed variable value
 */
Parser.numberParser = function(filename, content) {
  const numberValue = Number(content);
  return Number.isNaN(numberValue) ? undefined : numberValue;
};

var order = ['js', 'ts', 'json', 'json5', 'hjson', 'toml', 'coffee', 'iced', 'yaml', 'yml', 'cson', 'properties', 'xml',
  'boolean', 'number'];
var definitions = {
  coffee: Parser.coffeeParser,
  cson: Parser.csonParser,
  hjson: Parser.hjsonParser,
  iced: Parser.icedParser,
  js: Parser.jsParser,
  json: Parser.jsonParser,
  json5: Parser.json5Parser,
  properties: Parser.propertiesParser,
  toml: Parser.tomlParser,
  ts: Parser.tsParser,
  xml: Parser.xmlParser,
  yaml: Parser.yamlParser,
  yml: Parser.yamlParser,
  boolean: Parser.booleanParser,
  number: Parser.numberParser
};

Parser.getParser = function(name) {
  return definitions[name];
};

Parser.setParser = function(name, parser) {
  definitions[name] = parser;
  if (order.indexOf(name) === -1) {
    order.push(name);
  }
};

Parser.getFilesOrder = function(name) {
  if (name) {
    return order.indexOf(name);
  }
  return order;
};

Parser.setFilesOrder = function(name, newIndex) {
  if (Array.isArray(name)) {
    return order = name;
  }
  if (typeof newIndex === 'number') {
    var index = order.indexOf(name);
    order.splice(newIndex, 0, name);
    if (index > -1) {
      order.splice(index >= newIndex ? index +1 : index, 1);
    }
  }
  return order;
};
});

var config_1 = createCommonjsModule(function (module) {
// config.js (c) 2010-2020 Loren West and other contributors
// May be freely distributed under the MIT license.
// For further details and documentation:
// http://lorenwest.github.com/node-config

// Dependencies
var DeferredConfig = defer.DeferredConfig,
    RawConfig = raw_1.RawConfig,
    Parser = parser;

// Static members
var DEFAULT_CLONE_DEPTH = 20,
    CONFIG_DIR, RUNTIME_JSON_FILENAME, NODE_ENV, APP_INSTANCE,
    HOST, HOSTNAME, CONFIG_SKIP_GITCRYPT,
    NODE_CONFIG_PARSER,
    env = {},
    configSources = [],          // Configuration sources - array of {name, original, parsed}
    checkMutability = true,      // Check for mutability/immutability on first get
    gitCryptTestRegex = /^.GITCRYPT/; // regular expression to test for gitcrypt files.

/**
 * <p>Application Configurations</p>
 *
 * <p>
 * The config module exports a singleton object representing all
 * configurations for this application deployment.
 * </p>
 *
 * <p>
 * Application configurations are stored in files within the config directory
 * of your application.  The default configuration file is loaded, followed
 * by files specific to the deployment type (development, testing, staging,
 * production, etc.).
 * </p>
 *
 * <p>
 * For example, with the following config/default.yaml file:
 * </p>
 *
 * <pre>
 *   ...
 *   customer:
 *     &nbsp;&nbsp;initialCredit: 500
 *     &nbsp;&nbsp;db:
 *       &nbsp;&nbsp;&nbsp;&nbsp;name: customer
 *       &nbsp;&nbsp;&nbsp;&nbsp;port: 5984
 *   ...
 * </pre>
 *
 * <p>
 * The following code loads the customer section into the CONFIG variable:
 * <p>
 *
 * <pre>
 *   var CONFIG = require('config').customer;
 *   ...
 *   newCustomer.creditLimit = CONFIG.initialCredit;
 *   database.open(CONFIG.db.name, CONFIG.db.port);
 *   ...
 * </pre>
 *
 * @module config
 * @class Config
 */

/**
 * <p>Get the configuration object.</p>
 *
 * <p>
 * The configuration object is a shared singleton object within the application,
 * attained by calling require('config').
 * </p>
 *
 * <p>
 * Usually you'll specify a CONFIG variable at the top of your .js file
 * for file/module scope. If you want the root of the object, you can do this:
 * </p>
 * <pre>
 * var CONFIG = require('config');
 * </pre>
 *
 * <p>
 * Sometimes you only care about a specific sub-object within the CONFIG
 * object.  In that case you could do this at the top of your file:
 * </p>
 * <pre>
 * var CONFIG = require('config').customer;
 * or
 * var CUSTOMER_CONFIG = require('config').customer;
 * </pre>
 *
 * <script type="text/javascript">
 *   document.getElementById("showProtected").style.display = "block";
 * </script>
 *
 * @method constructor
 * @return CONFIG {object} - The top level configuration object
 */
var Config = function() {
  var t = this;

  // Bind all utility functions to this
  for (var fnName in util) {
    if (typeof util[fnName] === 'function') {
      util[fnName] = util[fnName].bind(t);
    }
  }

  // Merge configurations into this
  util.extendDeep(t, util.loadFileConfigs());
  util.attachProtoDeep(t);

  // Perform strictness checks and possibly throw an exception.
  util.runStrictnessChecks(t);
};

/**
 * Utilities are under the util namespace vs. at the top level
 */
var util = Config.prototype.util = {};

/**
 * Underlying get mechanism
 *
 * @private
 * @method getImpl
 * @param object {object} - Object to get the property for
 * @param property {string|string[]} - The property name to get (as an array or '.' delimited string)
 * @return value {*} - Property value, including undefined if not defined.
 */
var getImpl= function(object, property) {
  var elems = Array.isArray(property) ? property : property.split('.'),
      name = elems[0],
      value = object[name];
  if (elems.length <= 1) {
    return value;
  }
  // Note that typeof null === 'object'
  if (value === null || typeof value !== 'object') {
    return undefined;
  }
  return getImpl(value, elems.slice(1));
};

/**
 * <p>Get a configuration value</p>
 *
 * <p>
 * This will return the specified property value, throwing an exception if the
 * configuration isn't defined.  It is used to assure configurations are defined
 * before being used, and to prevent typos.
 * </p>
 *
 * @method get
 * @param property {string} - The configuration property to get. Can include '.' sub-properties.
 * @return value {*} - The property value
 */
Config.prototype.get = function(property) {
  if(property === null || property === undefined){
    throw new Error("Calling config.get with null or undefined argument");
  }

  // Make configurations immutable after first get (unless disabled)
  if (checkMutability) {
    if (!util.initParam('ALLOW_CONFIG_MUTATIONS', false)) {
      util.makeImmutable(config);
    }
    checkMutability = false;
  }
  var t = this,
      value = getImpl(t, property);

  // Produce an exception if the property doesn't exist
  if (value === undefined) {
    throw new Error('Configuration property "' + property + '" is not defined');
  }

  // Return the value
  return value;
};

/**
 * Test that a configuration parameter exists
 *
 * <pre>
 *    var config = require('config');
 *    if (config.has('customer.dbName')) {
 *      console.log('Customer database name: ' + config.customer.dbName);
 *    }
 * </pre>
 *
 * @method has
 * @param property {string} - The configuration property to test. Can include '.' sub-properties.
 * @return isPresent {boolean} - True if the property is defined, false if not defined.
 */
Config.prototype.has = function(property) {
  // While get() throws an exception for undefined input, has() is designed to test validity, so false is appropriate
  if(property === null || property === undefined){
    return false;
  }
  var t = this;
  return (getImpl(t, property) !== undefined);
};

/**
 * <p>
 * Set default configurations for a node.js module.
 * </p>
 *
 * <p>
 * This allows module developers to attach their configurations onto the
 * default configuration object so they can be configured by the consumers
 * of the module.
 * </p>
 *
 * <p>Using the function within your module:</p>
 * <pre>
 *   var CONFIG = require("config");
 *   CONFIG.util.setModuleDefaults("MyModule", {
 *   &nbsp;&nbsp;templateName: "t-50",
 *   &nbsp;&nbsp;colorScheme: "green"
 *   });
 * <br>
 *   // Template name may be overridden by application config files
 *   console.log("Template: " + CONFIG.MyModule.templateName);
 * </pre>
 *
 * <p>
 * The above example results in a "MyModule" element of the configuration
 * object, containing an object with the specified default values.
 * </p>
 *
 * @method setModuleDefaults
 * @param moduleName {string} - Name of your module.
 * @param defaultProperties {object} - The default module configuration.
 * @return moduleConfig {object} - The module level configuration object.
 */
util.setModuleDefaults = function (moduleName, defaultProperties) {

  // Copy the properties into a new object
  var t = this,
    moduleConfig = util.cloneDeep(defaultProperties);

  // Set module defaults into the first sources element
  if (configSources.length === 0 || configSources[0].name !== 'Module Defaults') {
    configSources.splice(0, 0, {
      name: 'Module Defaults',
      parsed: {}
    });
  }
  util.setPath(configSources[0].parsed, moduleName.split('.'), {});
  util.extendDeep(getImpl(configSources[0].parsed, moduleName), defaultProperties);

  // Create a top level config for this module if it doesn't exist
  util.setPath(t, moduleName.split('.'), getImpl(t, moduleName) || {});

  // Extend local configurations into the module config
  util.extendDeep(moduleConfig, getImpl(t, moduleName));

  // Merge the extended configs without replacing the original
  util.extendDeep(getImpl(t, moduleName), moduleConfig);

  // reset the mutability check for "config.get" method.
  // we are not making t[moduleName] immutable immediately,
  // since there might be more modifications before the first config.get
  if (!util.initParam('ALLOW_CONFIG_MUTATIONS', false)) {
    checkMutability = true;
  }

  // Attach handlers & watchers onto the module config object
  return util.attachProtoDeep(getImpl(t, moduleName));
};

/**
 * <p>Make a configuration property hidden so it doesn't appear when enumerating
 * elements of the object.</p>
 *
 * <p>
 * The property still exists and can be read from and written to, but it won't
 * show up in for ... in loops, Object.keys(), or JSON.stringify() type methods.
 * </p>
 *
 * <p>
 * If the property already exists, it will be made hidden.  Otherwise it will
 * be created as a hidden property with the specified value.
 * </p>
 *
 * <p><i>
 * This method was built for hiding configuration values, but it can be applied
 * to <u>any</u> javascript object.
 * </i></p>
 *
 * <p>Example:</p>
 * <pre>
 *   var CONFIG = require('config');
 *   ...
 *
 *   // Hide the Amazon S3 credentials
 *   CONFIG.util.makeHidden(CONFIG.amazonS3, 'access_id');
 *   CONFIG.util.makeHidden(CONFIG.amazonS3, 'secret_key');
 * </pre>
 *
 * @method makeHidden
 * @param object {object} - The object to make a hidden property into.
 * @param property {string} - The name of the property to make hidden.
 * @param value {*} - (optional) Set the property value to this (otherwise leave alone)
 * @return object {object} - The original object is returned - for chaining.
 */
util.makeHidden = function(object, property, value) {

  // If the new value isn't specified, just mark the property as hidden
  if (typeof value === 'undefined') {
    Object.defineProperty(object, property, {
      enumerable : false
    });
  }
  // Otherwise set the value and mark it as hidden
  else {
    Object.defineProperty(object, property, {
      value      : value,
      enumerable : false
    });
  }

  return object;
};

/**
 * <p>Make a javascript object property immutable (assuring it cannot be changed
 * from the current value).</p>
 * <p>
 * If the specified property is an object, all attributes of that object are
 * made immutable, including properties of contained objects, recursively.
 * If a property name isn't supplied, all properties of the object are made
 * immutable.
 * </p>
 * <p>
 *
 * </p>
 * <p>
 * New properties can be added to the object and those properties will not be
 * immutable unless this method is called on those new properties.
 * </p>
 * <p>
 * This operation cannot be undone.
 * </p>
 *
 * <p>Example:</p>
 * <pre>
 *   var config = require('config');
 *   var myObject = {hello:'world'};
 *   config.util.makeImmutable(myObject);
 * </pre>
 *
 * @method makeImmutable
 * @param object {object} - The object to specify immutable properties for
 * @param [property] {string | [string]} - The name of the property (or array of names) to make immutable.
 *        If not provided, all owned properties of the object are made immutable.
 * @param [value] {* | [*]} - Property value (or array of values) to set
 *        the property to before making immutable. Only used when setting a single
 *        property. Retained for backward compatibility.
 * @return object {object} - The original object is returned - for chaining.
 */
util.makeImmutable = function(object, property, value) {
  if (Buffer.isBuffer(object)) {
    return object;
  }
  var properties = null;

  // Backwards compatibility mode where property/value can be specified
  if (typeof property === 'string') {
    return Object.defineProperty(object, property, {
      value : (typeof value === 'undefined') ? object[property] : value,
      writable : false,
      configurable: false
    });
  }

  // Get the list of properties to work with
  if (Array.isArray(property)) {
    properties = property;
  }
  else {
    properties = Object.keys(object);
  }

  // Process each property
  for (var i = 0; i < properties.length; i++) {
    var propertyName = properties[i],
        value = object[propertyName];

    if (value instanceof RawConfig) {
      Object.defineProperty(object, propertyName, {
        value: value.resolve(),
        writable: false,
        configurable: false
      });
    } else if (Array.isArray(value)) {
      // Ensure object items of this array are also immutable.
      value.forEach((item, index) => { if (util.isObject(item) || Array.isArray(item)) util.makeImmutable(item); });

      Object.defineProperty(object, propertyName, {
        value: Object.freeze(value)
      });
    } else {
      Object.defineProperty(object, propertyName, {
        value: value,
        writable : false,
        configurable: false
      });

      // Ensure new properties can not be added.
      Object.preventExtensions(object);

      // Call recursively if an object.
      if (util.isObject(value)) {
        util.makeImmutable(value);
      }
    }
  }

  return object;
};

/**
 * Return the sources for the configurations
 *
 * <p>
 * All sources for configurations are stored in an array of objects containing
 * the source name (usually the filename), the original source (as a string),
 * and the parsed source as an object.
 * </p>
 *
 * @method getConfigSources
 * @return configSources {Array[Object]} - An array of objects containing
 *    name, original, and parsed elements
 */
util.getConfigSources = function() {
  return configSources.slice(0);
};

/**
 * Load the individual file configurations.
 *
 * <p>
 * This method builds a map of filename to the configuration object defined
 * by the file.  The search order is:
 * </p>
 *
 * <pre>
 *   default.EXT
 *   (deployment).EXT
 *   (hostname).EXT
 *   (hostname)-(deployment).EXT
 *   local.EXT
 *   local-(deployment).EXT
 *   runtime.json
 * </pre>
 *
 * <p>
 * EXT can be yml, yaml, coffee, iced, json, cson or js signifying the file type.
 * yaml (and yml) is in YAML format, coffee is a coffee-script, iced is iced-coffee-script,
 * json is in JSON format, cson is in CSON format, properties is in .properties format
 * (http://en.wikipedia.org/wiki/.properties), and js is a javascript executable file that is
 * require()'d with module.exports being the config object.
 * </p>
 *
 * <p>
 * hostname is the $HOST environment variable (or --HOST command line parameter)
 * if set, otherwise the $HOSTNAME environment variable (or --HOSTNAME command
 * line parameter) if set, otherwise the hostname found from
 * require('os').hostname().
 * </p>
 *
 * <p>
 * Once a hostname is found, everything from the first period ('.') onwards
 * is removed. For example, abc.example.com becomes abc
 * </p>
 *
 * <p>
 * (deployment) is the deployment type, found in the $NODE_ENV environment
 * variable (which can be overriden by using $NODE_CONFIG_ENV
 * environment variable). Defaults to 'development'.
 * </p>
 *
 * <p>
 * The runtime.json file contains configuration changes made at runtime either
 * manually, or by the application setting a configuration value.
 * </p>
 *
 * <p>
 * If the $NODE_APP_INSTANCE environment variable (or --NODE_APP_INSTANCE
 * command line parameter) is set, then files with this appendage will be loaded.
 * See the Multiple Application Instances section of the main documentaion page
 * for more information.
 * </p>
 *
 * @protected
 * @method loadFileConfigs
 * @return config {Object} The configuration object
 */
util.loadFileConfigs = function(configDir) {

  // Initialize
  var config = {};

  // Initialize parameters from command line, environment, or default
  NODE_ENV = util.initParam('NODE_ENV', 'development');

  // Override, NODE_ENV if NODE_CONFIG_ENV is specified.
  NODE_ENV = util.initParam('NODE_CONFIG_ENV', NODE_ENV);

  // Split files name, for loading multiple files.
  NODE_ENV = NODE_ENV.split(',');

  CONFIG_DIR = configDir || util.initParam('NODE_CONFIG_DIR', Path.join( process.cwd(), 'config') );
  if (CONFIG_DIR.indexOf('.') === 0) {
    CONFIG_DIR = Path.join(process.cwd() , CONFIG_DIR);
  }

  APP_INSTANCE = util.initParam('NODE_APP_INSTANCE');
  HOST = util.initParam('HOST');
  HOSTNAME = util.initParam('HOSTNAME');
  CONFIG_SKIP_GITCRYPT = util.initParam('CONFIG_SKIP_GITCRYPT');

  // This is for backward compatibility
  RUNTIME_JSON_FILENAME = util.initParam('NODE_CONFIG_RUNTIME_JSON', Path.join(CONFIG_DIR , 'runtime.json') );

  NODE_CONFIG_PARSER = util.initParam('NODE_CONFIG_PARSER');
  if (NODE_CONFIG_PARSER) {
    try {
      var parserModule = Path.isAbsolute(NODE_CONFIG_PARSER)
        ? NODE_CONFIG_PARSER
        : Path.join(CONFIG_DIR, NODE_CONFIG_PARSER);
      Parser = commonjsRequire(parserModule);
    }
    catch (e) {
      console.warn('Failed to load config parser from ' + NODE_CONFIG_PARSER);
      console.log(e);
    }
  }

  // Determine the host name from the OS module, $HOST, or $HOSTNAME
  // Remove any . appendages, and default to null if not set
  try {
    var hostName = HOST || HOSTNAME;

    if (!hostName) {
        var OS = require$$3;
        hostName = OS.hostname();
    }
  } catch (e) {
    hostName = '';
  }

  // Store the hostname that won.
  env.HOSTNAME = hostName;

  // Read each file in turn
  var baseNames = ['default'].concat(NODE_ENV);

  // #236: Also add full hostname when they are different.
  if (hostName) {
    var firstDomain = hostName.split('.')[0];

    NODE_ENV.forEach(function(env) {
      // Backward compatibility
      baseNames.push(firstDomain, firstDomain + '-' + env);

      // Add full hostname when it is not the same
      if (hostName !== firstDomain) {
        baseNames.push(hostName, hostName + '-' + env);
      }
    });
  }

  NODE_ENV.forEach(function(env) {
    baseNames.push('local', 'local-' + env);
  });

  var allowedFiles = {};
  var resolutionIndex = 1;
  var extNames = Parser.getFilesOrder();
  baseNames.forEach(function(baseName) {
    extNames.forEach(function(extName) {
      allowedFiles[baseName + '.' + extName] = resolutionIndex++;
      if (APP_INSTANCE) {
        allowedFiles[baseName + '-' + APP_INSTANCE + '.' + extName] = resolutionIndex++;
      }
    });
  });

  var locatedFiles = util.locateMatchingFiles(CONFIG_DIR, allowedFiles);
  locatedFiles.forEach(function(fullFilename) {
    var configObj = util.parseFile(fullFilename);
    if (configObj) {
      util.extendDeep(config, configObj);
    }
  });

  // Override configurations from the $NODE_CONFIG environment variable
  // NODE_CONFIG only applies to the base config
  if (!configDir) {
    var envConfig = {};
    if (process.env.NODE_CONFIG) {
      try {
        envConfig = JSON.parse(process.env.NODE_CONFIG);
      } catch(e) {
        console.error('The $NODE_CONFIG environment variable is malformed JSON');
      }
      util.extendDeep(config, envConfig);
      configSources.push({
        name: "$NODE_CONFIG",
        parsed: envConfig,
      });
    }

    // Override configurations from the --NODE_CONFIG command line
    var cmdLineConfig = util.getCmdLineArg('NODE_CONFIG');
    if (cmdLineConfig) {
      try {
        cmdLineConfig = JSON.parse(cmdLineConfig);
      } catch(e) {
        console.error('The --NODE_CONFIG={json} command line argument is malformed JSON');
      }
      util.extendDeep(config, cmdLineConfig);
      configSources.push({
        name: "--NODE_CONFIG argument",
        parsed: cmdLineConfig,
      });
    }

    // Place the mixed NODE_CONFIG into the environment
    env['NODE_CONFIG'] = JSON.stringify(util.extendDeep(envConfig, cmdLineConfig, {}));
  }

  // Override with environment variables if there is a custom-environment-variables.EXT mapping file
  var customEnvVars = util.getCustomEnvVars(CONFIG_DIR, extNames);
  util.extendDeep(config, customEnvVars);

  // Extend the original config with the contents of runtime.json (backwards compatibility)
  var runtimeJson = util.parseFile(RUNTIME_JSON_FILENAME) || {};
  util.extendDeep(config, runtimeJson);

  util.resolveDeferredConfigs(config);

  // Return the configuration object
  return config;
};

/**
 * Return a list of fullFilenames who exists in allowedFiles
 * Ordered according to allowedFiles argument specifications
 *
 * @protected
 * @method locateMatchingFiles
 * @param configDirs {string}   the config dir, or multiple dirs separated by a column (:)
 * @param allowedFiles {object} an object. keys and supported filenames
 *                              and values are the position in the resolution order
 * @returns {string[]}          fullFilenames - path + filename
 */
util.locateMatchingFiles = function(configDirs, allowedFiles) {
  return configDirs.split(Path.delimiter)
    .reduce(function(files, configDir) {
      if (configDir) {
        try {
          FileSystem.readdirSync(configDir).forEach(function(file) {
            if (allowedFiles[file]) {
              files.push([allowedFiles[file], Path.join(configDir, file)]);
            }
          });
        }
        catch(e) {}
        return files;
      }
    }, [])
    .sort(function(a, b) { return a[0] - b[0]; })
    .map(function(file) { return file[1]; });
};

// Using basic recursion pattern, find all the deferred values and resolve them.
util.resolveDeferredConfigs = function (config) {
  var deferred = [];

  function _iterate (prop) {

    // We put the properties we are going to look it in an array to keep the order predictable
    var propsToSort = [];

    // First step is to put the properties of interest in an array
    for (var property in prop) {
      if (prop.hasOwnProperty(property) && prop[property] != null) {
        propsToSort.push(property);
      }
    }

    // Second step is to iterate of the elements in a predictable (sorted) order
    propsToSort.sort().forEach(function (property) {
      if (prop[property].constructor === Object) {
        _iterate(prop[property]);
      } else if (prop[property].constructor === Array) {
        for (var i = 0; i < prop[property].length; i++) {
          if (prop[property][i] instanceof DeferredConfig) {
            deferred.push(prop[property][i].prepare(config, prop[property], i));
          }
          else {
            _iterate(prop[property][i]);
          }
        }
      } else {
        if (prop[property] instanceof DeferredConfig) {
          deferred.push(prop[property].prepare(config, prop, property));
        }
        // else: Nothing to do. Keep the property how it is.
      }
    });
  }

  _iterate(config);

  deferred.forEach(function (defer) { defer.resolve(); });
};

/**
 * Parse and return the specified configuration file.
 *
 * If the file exists in the application config directory, it will
 * parse and return it as a JavaScript object.
 *
 * The file extension determines the parser to use.
 *
 * .js = File to run that has a module.exports containing the config object
 * .coffee = File to run that has a module.exports with coffee-script containing the config object
 * .iced = File to run that has a module.exports with iced-coffee-script containing the config object
 * All other supported file types (yaml, toml, json, cson, hjson, json5, properties, xml)
 * are parsed with util.parseString.
 *
 * If the file doesn't exist, a null will be returned.  If the file can't be
 * parsed, an exception will be thrown.
 *
 * This method performs synchronous file operations, and should not be called
 * after synchronous module loading.
 *
 * @protected
 * @method parseFile
 * @param fullFilename {string} The full file path and name
 * @return configObject {object|null} The configuration object parsed from the file
 */
util.parseFile = function(fullFilename) {
  var configObject = null,
      fileContent = null;

  // Note that all methods here are the Sync versions.  This is appropriate during
  // module loading (which is a synchronous operation), but not thereafter.

  try {
    // Try loading the file.
    fileContent = FileSystem.readFileSync(fullFilename, 'utf-8');
    fileContent = fileContent.replace(/^\uFEFF/, '');
  }
  catch (e2) {
    if (e2.code !== 'ENOENT') {
      throw new Error('Config file ' + fullFilename + ' cannot be read. Error code is: '+e2.code
                        +'. Error message is: '+e2.message);
    }
    return null;  // file doesn't exists
  }

  // Parse the file based on extension
  try {

    // skip if it's a gitcrypt file and CONFIG_SKIP_GITCRYPT is true
    if (CONFIG_SKIP_GITCRYPT) {
      if (gitCryptTestRegex.test(fileContent)) {
        console.error('WARNING: ' + fullFilename + ' is a git-crypt file and CONFIG_SKIP_GITCRYPT is set. skipping.');
        return null;
      }
    }

    configObject = Parser.parse(fullFilename, fileContent);
  }
  catch (e3) {
    if (gitCryptTestRegex.test(fileContent)) {
      console.error('ERROR: ' + fullFilename + ' is a git-crypt file and CONFIG_SKIP_GITCRYPT is not set.');
    }
    throw new Error("Cannot parse config file: '" + fullFilename + "': " + e3);
  }

  // Keep track of this configuration sources, including empty ones
  if (typeof configObject === 'object') {
    configSources.push({
      name: fullFilename,
      original: fileContent,
      parsed: configObject,
    });
  }

  return configObject;
};

/**
 * Parse and return the specied string with the specified format.
 *
 * The format determines the parser to use.
 *
 * json = File is parsed using JSON.parse()
 * yaml (or yml) = Parsed with a YAML parser
 * toml = Parsed with a TOML parser
 * cson = Parsed with a CSON parser
 * hjson = Parsed with a HJSON parser
 * json5 = Parsed with a JSON5 parser
 * properties = Parsed with the 'properties' node package
 * xml = Parsed with a XML parser
 *
 * If the file doesn't exist, a null will be returned.  If the file can't be
 * parsed, an exception will be thrown.
 *
 * This method performs synchronous file operations, and should not be called
 * after synchronous module loading.
 *
 * @protected
 * @method parseString
 * @param content {string} The full content
 * @param format {string} The format to be parsed
 * @return {configObject} The configuration object parsed from the string
 */
util.parseString = function (content, format) {
  var parser = Parser.getParser(format);
  if (typeof parser === 'function') {
    return parser(null, content);
  }
};

/**
 * Attach the Config class prototype to all config objects recursively.
 *
 * <p>
 * This allows you to do anything with CONFIG sub-objects as you can do with
 * the top-level CONFIG object.  It's so you can do this:
 * </p>
 *
 * <pre>
 *   var CUST_CONFIG = require('config').Customer;
 *   CUST_CONFIG.get(...)
 * </pre>
 *
 * @protected
 * @method attachProtoDeep
 * @param toObject
 * @param depth
 * @return toObject
 */
util.attachProtoDeep = function(toObject, depth) {
  if (toObject instanceof RawConfig) {
    return toObject;
  }
  depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
  if (depth < 0) {
    return toObject;
  }

  // Adding Config.prototype methods directly to toObject as hidden properties
  // because adding to toObject.__proto__ exposes the function in toObject
  for (var fnName in Config.prototype) {
    if (!toObject[fnName]) {
      util.makeHidden(toObject, fnName, Config.prototype[fnName]);
    }
  }

  // Add prototypes to sub-objects
  for (var prop in toObject) {
    if (util.isObject(toObject[prop])) {
      util.attachProtoDeep(toObject[prop], depth - 1);
    }
  }

  // Return the original object
  return toObject;
};

/**
 * Return a deep copy of the specified object.
 *
 * This returns a new object with all elements copied from the specified
 * object.  Deep copies are made of objects and arrays so you can do anything
 * with the returned object without affecting the input object.
 *
 * @protected
 * @method cloneDeep
 * @param parent {object} The original object to copy from
 * @param [depth=20] {Integer} Maximum depth (default 20)
 * @return {object} A new object with the elements copied from the copyFrom object
 *
 * This method is copied from https://github.com/pvorb/node-clone/blob/17eea36140d61d97a9954c53417d0e04a00525d9/clone.js
 *
 * Copyright © 2011-2014 Paul Vorbach and contributors.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the “Software”), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions: The above copyright notice and this permission
 * notice shall be included in all copies or substantial portions of the Software.
 */
util.cloneDeep = function cloneDeep(parent, depth, circular, prototype) {
  // maintain two arrays for circular references, where corresponding parents
  // and children have the same index
  var allParents = [];
  var allChildren = [];

  var useBuffer = typeof Buffer != 'undefined';

  if (typeof circular === 'undefined')
    circular = true;

  if (typeof depth === 'undefined')
    depth = 20;

  // recurse this function so we don't reset allParents and allChildren
  function _clone(parent, depth) {
    // cloning null always returns null
    if (parent === null)
      return null;

    if (depth === 0)
      return parent;

    var child;
    if (typeof parent != 'object') {
      return parent;
    }

    if (Utils.isArray(parent)) {
      child = [];
    } else if (Utils.isRegExp(parent)) {
      child = new RegExp(parent.source, util.getRegExpFlags(parent));
      if (parent.lastIndex) child.lastIndex = parent.lastIndex;
    } else if (Utils.isDate(parent)) {
      child = new Date(parent.getTime());
    } else if (useBuffer && Buffer.isBuffer(parent)) {
      child = new Buffer(parent.length);
      parent.copy(child);
      return child;
    } else {
      if (typeof prototype === 'undefined') child = Object.create(Object.getPrototypeOf(parent));
      else child = Object.create(prototype);
    }

    if (circular) {
      var index = allParents.indexOf(parent);

      if (index != -1) {
        return allChildren[index];
      }
      allParents.push(parent);
      allChildren.push(child);
    }

    for (var i in parent) {
      var propDescriptor  = Object.getOwnPropertyDescriptor(parent,i);
      var hasGetter = ((propDescriptor !== undefined) && (propDescriptor.get !== undefined));

      if (hasGetter){
        Object.defineProperty(child,i,propDescriptor);
      } else if (util.isPromise(parent[i])) {
        child[i] = parent[i];
      } else {
        child[i] = _clone(parent[i], depth - 1);
      }
    }

    return child;
  }

  return _clone(parent, depth);
};

/**
 * Set objects given a path as a string list
 *
 * @protected
 * @method setPath
 * @param object {object} - Object to set the property on
 * @param path {array[string]} - Array path to the property
 * @param value {*} - value to set, ignoring null
 */
util.setPath = function (object, path, value) {
  var nextKey = null;
  if (value === null || path.length === 0) {
    return;
  }
  else if (path.length === 1) { // no more keys to make, so set the value
    object[path.shift()] = value;
  }
  else {
    nextKey = path.shift();
    if (!object.hasOwnProperty(nextKey)) {
      object[nextKey] = {};
    }
    util.setPath(object[nextKey], path, value);
  }
};

/**
 * Create a new object patterned after substitutionMap, where:
 * 1. Terminal string values in substitutionMap are used as keys
 * 2. To look up values in a key-value store, variables
 * 3. And parent keys are created as necessary to retain the structure of substitutionMap.
 *
 * @protected
 * @method substituteDeep
 * @param substitionMap {object} - an object whose terminal (non-subobject) values are strings
 * @param variables {object[string:value]} - usually process.env, a flat object used to transform
 *      terminal values in a copy of substititionMap.
 * @returns {object} - deep copy of substitutionMap with only those paths whose terminal values
 *      corresponded to a key in `variables`
 */
util.substituteDeep = function (substitutionMap, variables) {
  var result = {};

  function _substituteVars(map, vars, pathTo) {
    for (var prop in map) {
      var value = map[prop];
      if (typeof(value) === 'string') { // We found a leaf variable name
        if (vars[value] !== undefined) { // if the vars provide a value set the value in the result map
          util.setPath(result, pathTo.concat(prop), vars[value]);
        }
      }
      else if (util.isObject(value)) { // work on the subtree, giving it a clone of the pathTo
        if ('__name' in value && '__format' in value && vars[value.__name] !== undefined) {
          try {
            var parsedValue = util.parseString(vars[value.__name], value.__format);
          } catch(err) {
            err.message = '__format parser error in ' + value.__name + ': ' + err.message;
            throw err;
          }
          util.setPath(result, pathTo.concat(prop), parsedValue);
        } else {
          _substituteVars(value, vars, pathTo.concat(prop));
        }
      }
      else {
        msg = "Illegal key type for substitution map at " + pathTo.join('.') + ': ' + typeof(value);
        throw Error(msg);
      }
    }
  }

  _substituteVars(substitutionMap, variables, []);
  return result;

};

/* Map environment variables into the configuration if a mapping file,
 * `custom-environment-variables.EXT` exists.
 *
 * @protected
 * @method getCustomEnvVars
 * @param CONFIG_DIR {string} - the passsed configuration directory
 * @param extNames {Array[string]} - acceptable configuration file extension names.
 * @returns {object} - mapped environment variables or {} if there are none
 */
util.getCustomEnvVars = function (CONFIG_DIR, extNames) {
  var result = {};
  var resolutionIndex = 1;
  var allowedFiles = {};
  extNames.forEach(function (extName) {
    allowedFiles['custom-environment-variables' + '.' + extName] = resolutionIndex++;
  });
  var locatedFiles = util.locateMatchingFiles(CONFIG_DIR, allowedFiles);
  locatedFiles.forEach(function (fullFilename) {
    var configObj = util.parseFile(fullFilename);
    if (configObj) {
      var environmentSubstitutions = util.substituteDeep(configObj, process.env);
      util.extendDeep(result, environmentSubstitutions);
    }
  });
  return result;
};

/**
 * Return true if two objects have equal contents.
 *
 * @protected
 * @method equalsDeep
 * @param object1 {object} The object to compare from
 * @param object2 {object} The object to compare with
 * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
 * @return {boolean} True if both objects have equivalent contents
 */
util.equalsDeep = function(object1, object2, depth) {
  depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
  if (depth < 0) {
    return {};
  }

  // Fast comparisons
  if (!object1 || !object2) {
    return false;
  }
  if (object1 === object2) {
    return true;
  }
  if (typeof(object1) != 'object' || typeof(object2) != 'object') {
    return false;
  }

  // They must have the same keys.  If their length isn't the same
  // then they're not equal.  If the keys aren't the same, the value
  // comparisons will fail.
  if (Object.keys(object1).length != Object.keys(object2).length) {
    return false;
  }

  // Compare the values
  for (var prop in object1) {

    // Call recursively if an object or array
    if (object1[prop] && typeof(object1[prop]) === 'object') {
      if (!util.equalsDeep(object1[prop], object2[prop], depth - 1)) {
        return false;
      }
    }
    else {
      if (object1[prop] !== object2[prop]) {
        return false;
      }
    }
  }

  // Test passed.
  return true;
};

/**
 * Returns an object containing all elements that differ between two objects.
 * <p>
 * This method was designed to be used to create the runtime.json file
 * contents, but can be used to get the diffs between any two Javascript objects.
 * </p>
 * <p>
 * It works best when object2 originated by deep copying object1, then
 * changes were made to object2, and you want an object that would give you
 * the changes made to object1 which resulted in object2.
 * </p>
 *
 * @protected
 * @method diffDeep
 * @param object1 {object} The base object to compare to
 * @param object2 {object} The object to compare with
 * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
 * @return {object} A differential object, which if extended onto object1 would
 *                  result in object2.
 */
util.diffDeep = function(object1, object2, depth) {

  // Recursion detection
  var diff = {};
  depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
  if (depth < 0) {
    return {};
  }

  // Process each element from object2, adding any element that's different
  // from object 1.
  for (var parm in object2) {
    var value1 = object1[parm];
    var value2 = object2[parm];
    if (value1 && value2 && util.isObject(value2)) {
      if (!(util.equalsDeep(value1, value2))) {
        diff[parm] = util.diffDeep(value1, value2, depth - 1);
      }
    }
    else if (Array.isArray(value1) && Array.isArray(value2)) {
      if(!util.equalsDeep(value1, value2)) {
        diff[parm] = value2;
      }
    }
    else if (value1 !== value2){
      diff[parm] = value2;
    }
  }

  // Return the diff object
  return diff;

};

/**
 * Extend an object, and any object it contains.
 *
 * This does not replace deep objects, but dives into them
 * replacing individual elements instead.
 *
 * @protected
 * @method extendDeep
 * @param mergeInto {object} The object to merge into
 * @param mergeFrom... {object...} - Any number of objects to merge from
 * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
 * @return {object} The altered mergeInto object is returned
 */
util.extendDeep = function(mergeInto) {
  var vargs = Array.prototype.slice.call(arguments, 1);
  var depth = vargs.pop();
  if (typeof(depth) != 'number') {
    vargs.push(depth);
    depth = DEFAULT_CLONE_DEPTH;
  }

  // Recursion detection
  if (depth < 0) {
    return mergeInto;
  }

  // Cycle through each object to extend
  vargs.forEach(function(mergeFrom) {

    // Cycle through each element of the object to merge from
    for (var prop in mergeFrom) {

      // save original value in deferred elements
      var fromIsDeferredFunc = mergeFrom[prop] instanceof DeferredConfig;
      var isDeferredFunc = mergeInto[prop] instanceof DeferredConfig;

      if (fromIsDeferredFunc && mergeInto.hasOwnProperty(prop)) {
        mergeFrom[prop]._original = isDeferredFunc ? mergeInto[prop]._original : mergeInto[prop];
      }
      // Extend recursively if both elements are objects and target is not really a deferred function
      if (mergeFrom[prop] instanceof Date) {
        mergeInto[prop] = mergeFrom[prop];
      } if (mergeFrom[prop] instanceof RegExp) {
        mergeInto[prop] = mergeFrom[prop];
      } else if (util.isObject(mergeInto[prop]) && util.isObject(mergeFrom[prop]) && !isDeferredFunc) {
        util.extendDeep(mergeInto[prop], mergeFrom[prop], depth - 1);
      }
      else if (util.isPromise(mergeFrom[prop])) {
        mergeInto[prop] = mergeFrom[prop];
      }
      // Copy recursively if the mergeFrom element is an object (or array or fn)
      else if (mergeFrom[prop] && typeof mergeFrom[prop] === 'object') {
        mergeInto[prop] = util.cloneDeep(mergeFrom[prop], depth -1);
      }

      // Copy property descriptor otherwise, preserving accessors
      else if (Object.getOwnPropertyDescriptor(Object(mergeFrom), prop)){
          Object.defineProperty(mergeInto, prop, Object.getOwnPropertyDescriptor(Object(mergeFrom), prop));
      } else {
          mergeInto[prop] = mergeFrom[prop];
      }
    }
  });

  // Chain
  return mergeInto;

};

/**
 * Is the specified argument a regular javascript object?
 *
 * The argument is an object if it's a JS object, but not an array.
 *
 * @protected
 * @method isObject
 * @param obj {*} An argument of any type.
 * @return {boolean} TRUE if the arg is an object, FALSE if not
 */
util.isObject = function(obj) {
  return (obj !== null) && (typeof obj === 'object') && !(Array.isArray(obj));
};

/**
 * Is the specified argument a javascript promise?
 *
 * @protected
 * @method isPromise
 * @param obj {*} An argument of any type.
 * @returns {boolean}
 */
util.isPromise = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Promise]';
};

/**
 * <p>Initialize a parameter from the command line or process environment</p>
 *
 * <p>
 * This method looks for the parameter from the command line in the format
 * --PARAMETER=VALUE, then from the process environment, then from the
 * default specified as an argument.
 * </p>
 *
 * @method initParam
 * @param paramName {String} Name of the parameter
 * @param [defaultValue] {Any} Default value of the parameter
 * @return {Any} The found value, or default value
 */
util.initParam = function (paramName, defaultValue) {

  // Record and return the value
  var value = util.getCmdLineArg(paramName) || process.env[paramName] || defaultValue;
  env[paramName] = value;
  return value;
};

/**
 * <p>Get Command Line Arguments</p>
 *
 * <p>
 * This method allows you to retrieve the value of the specified command line argument.
 * </p>
 *
 * <p>
 * The argument is case sensitive, and must be of the form '--ARG_NAME=value'
 * </p>
 *
 * @method getCmdLineArg
 * @param searchFor {String} The argument name to search for
 * @return {*} false if the argument was not found, the argument value if found
 */
util.getCmdLineArg = function (searchFor) {
    var cmdLineArgs = process.argv.slice(2, process.argv.length),
        argName = '--' + searchFor + '=';

    for (var argvIt = 0; argvIt < cmdLineArgs.length; argvIt++) {
      if (cmdLineArgs[argvIt].indexOf(argName) === 0) {
        return cmdLineArgs[argvIt].substr(argName.length);
      }
    }

    return false;
};

/**
 * <p>Get a Config Environment Variable Value</p>
 *
 * <p>
 * This method returns the value of the specified config environment variable,
 * including any defaults or overrides.
 * </p>
 *
 * @method getEnv
 * @param varName {String} The environment variable name
 * @return {String} The value of the environment variable
 */
util.getEnv = function (varName) {
  return env[varName];
};



/**
 * Returns a string of flags for regular expression `re`.
 *
 * @param {RegExp} re Regular expression
 * @returns {string} Flags
 */
util.getRegExpFlags = function (re) {
  var flags = '';
  re.global && (flags += 'g');
  re.ignoreCase && (flags += 'i');
  re.multiline && (flags += 'm');
  return flags;
};

/**
 * Returns a new deep copy of the current config object, or any part of the config if provided.
 *
 * @param {Object} config The part of the config to copy and serialize. Omit this argument to return the entire config.
 * @returns {Object} The cloned config or part of the config
 */
util.toObject = function(config) {
  return JSON.parse(JSON.stringify(config || this));
};

// Run strictness checks on NODE_ENV and NODE_APP_INSTANCE and throw an error if there's a problem.
util.runStrictnessChecks = function (config) {
  var sources = config.util.getConfigSources();

  var sourceFilenames = sources.map(function (src) {
    return Path.basename(src.name);
  });

  NODE_ENV.forEach(function(env) {
    // Throw an exception if there's no explicit config file for NODE_ENV
    var anyFilesMatchEnv = sourceFilenames.some(function (filename) {
        return filename.match(env);
    });
    // development is special-cased because it's the default value
    if (env && (env !== 'development') && !anyFilesMatchEnv) {
      _warnOrThrow("NODE_ENV value of '"+env+"' did not match any deployment config file names.");
    }
    // Throw if NODE_ENV matches' default' or 'local'
    if ((env === 'default') || (env === 'local')) {
      _warnOrThrow("NODE_ENV value of '"+env+"' is ambiguous.");
    }
  });

  // Throw an exception if there's no explict config file for NODE_APP_INSTANCE
  var anyFilesMatchInstance = sourceFilenames.some(function (filename) {
      return filename.match(APP_INSTANCE);
  });
  if (APP_INSTANCE && !anyFilesMatchInstance) {
    _warnOrThrow("NODE_APP_INSTANCE value of '"+APP_INSTANCE+"' did not match any instance config file names.");
  }

  function _warnOrThrow (msg) {
    var beStrict = process.env.NODE_CONFIG_STRICT_MODE;
    var prefix = beStrict ? 'FATAL: ' : 'WARNING: ';
    var seeURL = 'See https://github.com/lorenwest/node-config/wiki/Strict-Mode';

    console.error(prefix+msg);
    console.error(prefix+seeURL);

    // Accept 1 and true as truthy values. When set via process.env, Node.js casts them to strings.
    if (["true", "1"].indexOf(beStrict) >= 0) {
      throw new Error(prefix+msg+' '+seeURL);
    }
  }
};

// Instantiate and export the configuration
var config = module.exports = new Config();

// copy methods to util for backwards compatibility
util.stripComments = Parser.stripComments;
util.stripYamlComments = Parser.stripYamlComments;

// Produce warnings if the configuration is empty
var showWarnings = !(util.initParam('SUPPRESS_NO_CONFIG_WARNING'));
if (showWarnings && Object.keys(config).length === 0) {
  console.error('WARNING: No configurations found in configuration directory:' +CONFIG_DIR);
  console.error('WARNING: To disable this warning set SUPPRESS_NO_CONFIG_WARNING in the environment.');
}
});

var TICKING_TIME = config_1.get('global.tickingTime');
var POPULATION = config_1.get('nation.population');
var SIMULATE_FOR_DAYS = config_1.get('global.simulateForDays');
var FACILITATORS_INITIAL_HEADCCOUNT = config_1.get('deliberation.facilitatorsInitialHeadcount');
var PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN = config_1.get('deliberation.professionalsInitialHeadcountPerDomain');
var SUPREME_JUDGES_INITIAL_HEADCCOUNT = config_1.get('deliberation.supremeJudgesInitialHeadcount');
var UPPERBOUND = config_1.get('citizen.derivationUpperBound');
var LOWERBOUND = config_1.get('citizen.derivationLowerBound');

var StateMachine = /** @class */ (function () {
    function StateMachine() {
        this.people = [];
        this.treasury = 0;
        this.annualRevenue = 0;
        this.proposals = [];
        this.domains = [];
        this.miscellaneousAdministrations = [];
        this.AofMedia = new Administration();
        this.AofEducation = new Administration();
        this.AofSurveillance = new Administration();
        this.AofPolice = new Administration();
        this.AofJurisdiction = new Administration();
        this.AofKYC = new Administration();
        this.AofTEEManager = new Administration();
        this.supremeJudges = [];
        this.facilitators = [];
        this.professionals = new Map();
    }
    StateMachine.prototype.payTax = function (amount) {
        this.treasury += amount;
    };
    StateMachine.prototype.withdrawWelfare = function (amount) {
        this.treasury -= amount;
    };
    StateMachine.prototype.addDomain = function (name) {
        this.domains.push(name);
        this.professionals[name] = [];
    };
    StateMachine.prototype.addCitizen = function () {
        var citizen = new Citizen();
        this.people.push(citizen);
        return citizen;
    };
    StateMachine.prototype.removeCitizen = function (citizenId) {
        var index = this.people.map(function (c, i) { return c.id == citizenId ? i : 0; }).reduce(function (s, i) { return s + i; }, 0);
        this.people.splice(index, 1);
    };
    StateMachine.prototype.addSupremeJudge = function (judge) {
        this.supremeJudges.push(judge);
    };
    StateMachine.prototype.addFacilitator = function (facilitators) {
        this.facilitators.push(facilitators);
    };
    StateMachine.prototype.addProfessional = function (domain, professional) {
        this.professionals[domain].push(professional);
    };
    StateMachine.prototype.getPopulation = function () {
        return this.people.length;
    };
    StateMachine.prototype.getGDP = function () {
        return this.people.map(function (p) { return p.annualSalary; }).reduce(function (sum, el) { return sum + el; }, 0);
    };
    StateMachine.prototype.tick = function () {
        var _this = this;
        var context = this.validate();
        if (!context.code)
            throw new Error("DAO4N Error: Assumption viorated. " + context.report);
        // TODO tick all actors
        this.people.map(function (c) { return c.tick(); });
        this.proposals.map(function (p) { return p.tick(); });
        this.miscellaneousAdministrations.map(function (a) { return a.tick(); });
        this.AofMedia.tick();
        this.AofEducation.tick();
        this.AofSurveillance.tick();
        this.AofPolice.tick();
        this.AofJurisdiction.tick();
        this.AofKYC.tick();
        this.AofTEEManager.tick();
        this.supremeJudges.map(function (a) { return a.tick(); });
        this.facilitators.map(function (a) { return a.tick(); });
        this.domains.map(function (d) {
            _this.professionals[d].map(function (a) { return a.tick(); });
        });
        // TODO each ticks refer this https://paper.dropbox.com/doc/--A94iOUxIv4si~XPY5jFo1TMKAg-OSm6HZnzqnEz61jbe0izX
        // TODO calculate stats
    };
    StateMachine.prototype.validate = function () {
        // TODO check CROs' max headcount
        // TODO check budget exceeding
        // TODO check deregistration rate
        return {
            code: "a",
            report: ""
        };
    };
    StateMachine.prototype.submitProposal = function (proposer, problemType) {
        this.proposals.push(new Proposal(proposer, problemType));
    };
    StateMachine.prototype.approveProposal = function (proposal) {
        this.miscellaneousAdministrations.push(proposal.administrationToBeCreated);
        //TODO: Reward for participants
        //TODO: There's no tie between admin and vestedMonthlyBudget
    };
    StateMachine.prototype.updateProposal = function (proposal) {
        var _this = this;
        var pid = proposal.id;
        var index = this.proposals.map(function (p, i) { return p.id === pid ? i : 0; }).reduce(function (s, i) { return s + i; }, 0);
        this.proposals.splice(index, 1);
        this.proposals.push(proposal);
        var participants = [proposal.proposer].concat(proposal.representatives).concat(proposal.professionals);
        if (proposal.facilitator)
            participants.push(proposal.facilitator);
        var partIds = participants.map(function (p) { return p.id; });
        partIds.map(function (partId) {
            var partIndex = _this.people.map(function (p, i) { return p.id === partId ? i : 0; }).reduce(function (s, i) { return s + i; }, 0);
            _this.people.splice(partIndex, 1);
        });
        participants.map(function (p) {
            _this.people.push(p);
        });
    };
    return StateMachine;
}());
var state = (function () {
    var instance;
    function createInstance() {
        var object = new StateMachine();
        return object;
    }
    return {
        get: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        },
        set: function (_state) {
            instance = _state;
        }
    };
})();
var Proposal = /** @class */ (function () {
    function Proposal(proposer, problemType) {
        this.id = uuid(40);
        this.problemType = problemType;
        this.proposer = proposer;
        this.facilitator = null;
        this.domains = [];
        this.professionals = [];
        this.durationDays = this.getDurationDays();
        this.spentDays = 0;
        this.representativeHeadcount = 30;
        this.representatives = [];
        this.pickRepresentatives();
        this.progressismDegree = 30 + number(0, 60);
        this.humanrightsDegree = 30 + number(0, 60);
        this.administrationToBeCreated = new Administration();
        this.vestedMonthlyBudget = this.administrationToBeCreated.monthlyBudget;
        this.isFinished = false;
    }
    Proposal.prototype.getDurationDays = function () {
        switch (this.problemType) {
            case "a" /* ASSIGNMENT */:
                return 14;
            case "d" /* DISMISSAL */:
                return 3;
            case "n" /* NORMAL */:
                return 14;
            case "h" /* HEAVY */:
                return 60;
            case "vu" /* VARIABLE_UPDATE */:
                return 14;
        }
    };
    Proposal.prototype.finishProposal = function () {
        this.isFinished = true;
        this.proposer.isBusy = false;
        this.representatives = this.representatives.map(function (r) { r.isBusy = false; return r; });
        if (this.facilitator)
            this.facilitator.isBusy = false;
        this.professionals = this.professionals.map(function (p) { p.isBusy = false; return p; });
        state.get().updateProposal(this);
    };
    Proposal.prototype.tick = function () {
        var _this = this;
        var context = this.validate();
        switch (context.code) {
            case "i" /* INITIAL_JUDGE */:
                if (this.proposer.intelligenceDeviation > 50) ;
                else {
                    this.finishProposal();
                }
                break;
            case "fa" /* FACILITATOR_ASSIGNMENT */:
                var f = state.get().facilitators.filter(function (f) { return !f.isBusy; });
                this.facilitator = f[number(0, f.length - 1)];
                break;
            case "da" /* DOMAIN_ASSIGNMENT */:
                this.pickDomains();
                break;
            case "pa" /* PROFESSIONAL_ASSIGNMENT */:
                this.pickProfessionals();
                break;
            case "d" /* DELIBERATION */:
                if (!this.isFinished) {
                    var teachers = [this.facilitator].concat(this.professionals);
                    var avgTeacherintelligenceDeviation = teachers.map(function (t) { return t.intelligenceDeviation; }).reduce(function (s, i) { return s + i; }, 0) / teachers.length;
                    var dailyEffect_1 = (avgTeacherintelligenceDeviation - 50) / this.durationDays;
                    this.representatives = this.representatives.map(function (r) { return r.affectByDeliberation(dailyEffect_1); });
                    this.modificationRequests();
                }
                break;
            case "f" /* FINAL_JUDGE */:
                var forCount = this.representatives.filter(function (r) {
                    var res = false;
                    if (r.humanrightsPreference < 50 && r.progressismPreference > _this.progressismDegree) {
                        res = true;
                    }
                    else if (r.progressismPreference > _this.progressismDegree && r.humanrightsPreference > _this.humanrightsDegree) {
                        res = true;
                    }
                    return res;
                }).length;
                if (forCount > this.representatives.length / 2) {
                    state.get().approveProposal(this);
                    this.finishProposal();
                }
                else {
                    this.finishProposal();
                }
                break;
        }
        this.spentDays += TICKING_TIME;
    };
    Proposal.prototype.validate = function () {
        if (this.spentDays === 0) {
            return { code: "i" /* INITIAL_JUDGE */, report: "" };
        }
        else if (0 < this.spentDays && !this.facilitator) {
            return { code: "fa" /* FACILITATOR_ASSIGNMENT */, report: "" };
        }
        else if (!!this.facilitator && !this.domains) {
            return { code: "da" /* DOMAIN_ASSIGNMENT */, report: "" };
        }
        else if (!!this.facilitator && !!this.domains && !this.professionals) {
            return { code: "pa" /* PROFESSIONAL_ASSIGNMENT */, report: "" };
        }
        else if (!!this.facilitator && !!this.domains && !!this.professionals) {
            return { code: "d" /* DELIBERATION */, report: "" };
        }
        else if (this.spentDays === this.durationDays) {
            return { code: "f" /* FINAL_JUDGE */, report: "" };
        }
        else if (this.representatives.length > this.representativeHeadcount) {
            return {
                code: "h" /* HEADCOUNT_EXCEEDED */,
                report: "this.representatives.length=" + this.representatives.length + " and this.representativeHeadcount=" + this.representativeHeadcount
            };
        }
        else {
            return {
                code: "ue" /* UNKNOWN_ERROR */,
                report: "Proposal.validate(): Unknown error."
            };
        }
    };
    Proposal.prototype.pickFacilitator = function () {
        var candidates = state.get().facilitators.filter(function (f) { return !f.isBusy; });
        var randIndex = number(0, candidates.length - 1);
        var selectedFacilitator = candidates[randIndex];
        selectedFacilitator.isBusy = true;
        state.get().facilitators[randIndex] = selectedFacilitator;
        this.facilitator = selectedFacilitator;
    };
    Proposal.prototype.pickRepresentatives = function () {
        var _this = this;
        var rand = number(0, this.representativeHeadcount - 1);
        var shuffledPeople = shuffle(state.get().people.filter(function (p) { return (!p.isBusy && 16 <= p.age); }));
        __spreadArrays(Array(rand)).map(function (x, i) { return _this.representatives.push(shuffledPeople[i]); });
    };
    Proposal.prototype.pickDomains = function () {
        var _this = this;
        var rand = number(0, state.get().domains.length - 1);
        var shuffledDomains = shuffle(state.get().domains);
        __spreadArrays(Array(rand)).map(function (x, i) { return _this.domains.push(shuffledDomains[i]); });
    };
    Proposal.prototype.pickProfessionals = function () {
        var _this = this;
        this.domains.map(function (d) {
            var candidates = state.get().professionals[d].filter(function (p) { return !p.isBusy; });
            var randIndex = number(0, candidates.length - 1);
            var selectedProfessional = candidates[randIndex];
            selectedProfessional.isBusy = true;
            state.get().professionals[d][randIndex] = selectedProfessional;
            _this.professionals.push(selectedProfessional);
        });
    };
    Proposal.prototype.modificationRequests = function () {
        this.progressismDegree += number(0, 7) - number(0, 5);
        this.humanrightsDegree += number(0, 7) - number(0, 5);
    };
    return Proposal;
}());
var LifeStage;
(function (LifeStage) {
    LifeStage["SUFFRAGE"] = "s";
    LifeStage["WORKFORCE"] = "w";
    LifeStage["NURSING"] = "n";
    LifeStage["DEATH"] = "d";
    LifeStage["OTHER"] = "o";
})(LifeStage || (LifeStage = {}));
var Citizen = /** @class */ (function () {
    function Citizen() {
        this.id = uuid(40);
        this.annualSalary = 0;
        this.intelligenceDeviation = 30 + number(0, 60);
        this.conspiracyPreference = 100 - this.intelligenceDeviation + number(0, 10) - number(0, 10);
        this.cultPreference = 100 - this.intelligenceDeviation + number(0, 10) - number(0, 10);
        this.isSocioPath = !!(number(0, 1) & number(0, 1) & number(0, 1) & number(0, 1));
        this.isTakingCareForThe7thOffsprings = !!(number(0, 1) & number(0, 1) & number(0, 1) & number(0, 1));
        this.progressismPreference = 50 * ((this.intelligenceDeviation * this.conspiracyPreference * this.cultPreference) / (50 * 50 * 50)) ^ (1 / 3);
        this.humanrightsPreference = (this.isSocioPath) ? 30 :
            (this.isTakingCareForThe7thOffsprings) ? 70 :
                (this.progressismPreference > 60) ? 40 :
                    (this.progressismPreference > 50) ? 50 :
                        (this.progressismPreference > 40) ? 60 : 70;
        this.biologicallyCanBePregnant = !!number(0, 1);
        this.lifetime = number(65, 85) + number(0, 35) - number(0, 65);
        this.age = this.lifetime - number(0, this.lifetime);
        this.isBusy = false;
    }
    Citizen.prototype.tick = function () {
        var context = this.validate();
        this.earn(context);
        this.payTax(context);
        this.getWelfare(context);
        this.activePoliticalAction(context);
        this.passivePoliticalAction(context);
        if (context.code === LifeStage.DEATH) {
            state.get().removeCitizen(this.id);
        }
        this.age += TICKING_TIME / 365;
        this.validateAfter();
    };
    Citizen.prototype.validate = function () {
        if (this.age > this.lifetime) {
            return { code: LifeStage.DEATH, report: "" };
        }
        else if (this.age < 16 || 75 < this.age) {
            return { code: LifeStage.NURSING, report: "" };
        }
        else if (22 <= this.age && this.age <= 75) {
            return { code: LifeStage.WORKFORCE, report: "" };
        }
        else if (16 <= this.age) {
            return { code: LifeStage.SUFFRAGE, report: "" };
        }
        else {
            return { code: LifeStage.OTHER, report: "" };
        }
    };
    Citizen.prototype.validateAfter = function () {
        if (this.intelligenceDeviation < LOWERBOUND)
            this.intelligenceDeviation = LOWERBOUND;
        if (this.conspiracyPreference < LOWERBOUND)
            this.conspiracyPreference = LOWERBOUND;
        if (this.cultPreference < LOWERBOUND)
            this.cultPreference = LOWERBOUND;
        if (this.progressismPreference < LOWERBOUND)
            this.progressismPreference = LOWERBOUND;
        if (this.humanrightsPreference < LOWERBOUND)
            this.humanrightsPreference = LOWERBOUND;
        if (UPPERBOUND < this.intelligenceDeviation)
            this.intelligenceDeviation = UPPERBOUND;
        if (UPPERBOUND < this.conspiracyPreference)
            this.conspiracyPreference = UPPERBOUND;
        if (UPPERBOUND < this.cultPreference)
            this.cultPreference = UPPERBOUND;
        if (UPPERBOUND < this.progressismPreference)
            this.progressismPreference = UPPERBOUND;
        if (UPPERBOUND < this.humanrightsPreference)
            this.humanrightsPreference = UPPERBOUND;
    };
    Citizen.prototype.earn = function (context) {
        switch (context.code) {
            case LifeStage.SUFFRAGE:
                this.annualSalary = -1500 * 12;
                break;
            case LifeStage.WORKFORCE:
                if (this.annualSalary < 2000 * 12) {
                    this.annualSalary = 2000 * 12 + number(0, 1000 * 12);
                }
                else if (65 < this.age) {
                    this.annualSalary = 3000 * 12 + number(0, 2000 * 12) - number(0, 2000 * 12);
                }
                else if (50 < this.age) {
                    this.annualSalary = 5000 * 12 + number(0, 5000 * 12) - number(0, 1000 * 12);
                }
                else if (46 < this.age) {
                    this.annualSalary = 5000 * 12 + number(0, 4000 * 12) - number(0, 2000 * 12);
                }
                else if (32 < this.age) {
                    this.annualSalary = 4000 * 12 + number(0, 4000 * 12) - number(0, 1500 * 12);
                }
                else if (28 < this.age) {
                    this.annualSalary = 3000 * 12 + number(0, 2000 * 12) - number(0, 1000 * 12);
                }
                break;
            case LifeStage.NURSING:
                this.annualSalary = -1000 * 12;
                break;
            case LifeStage.DEATH:
                this.annualSalary = 0;
                break;
        }
    };
    Citizen.prototype.payTax = function (context) {
        var taxRate;
        switch (context.code) {
            case LifeStage.SUFFRAGE:
                taxRate = 0;
                break;
            case LifeStage.WORKFORCE:
                if (this.annualSalary < 2000 * 12) {
                    taxRate = 0.1;
                }
                else if (2000 * 12 <= this.annualSalary && this.annualSalary < 3000 * 12) {
                    taxRate = 0.13;
                }
                else if (3000 * 12 <= this.annualSalary && this.annualSalary < 4000 * 12) {
                    taxRate = 0.15;
                }
                else if (4000 * 12 <= this.annualSalary && this.annualSalary < 5000 * 12) {
                    taxRate = 0.17;
                }
                else if (5000 * 12 <= this.annualSalary && this.annualSalary < 6000 * 12) {
                    taxRate = 0.19;
                }
                else if (6000 * 12 <= this.annualSalary && this.annualSalary < 7000 * 12) {
                    taxRate = 0.21;
                }
                else if (7000 * 12 <= this.annualSalary && this.annualSalary < 8000 * 12) {
                    taxRate = 0.23;
                }
                else if (8000 * 12 <= this.annualSalary && this.annualSalary < 9000 * 12) {
                    taxRate = 0.25;
                }
                else if (9000 * 12 <= this.annualSalary && this.annualSalary < 10000 * 12) {
                    taxRate = 0.27;
                }
                else {
                    taxRate = 0.38;
                }
                break;
            case LifeStage.NURSING:
                taxRate = 0;
                break;
            case LifeStage.DEATH:
                taxRate = 0;
                break;
        }
        this.annualSalary = this.annualSalary * (1 - taxRate);
        state.get().payTax(this.annualSalary * taxRate);
    };
    Citizen.prototype.getWelfare = function (context) {
        var welfareAmount;
        switch (context.code) {
            case LifeStage.SUFFRAGE:
                welfareAmount = 1000 * 12;
                break;
            case LifeStage.WORKFORCE:
                welfareAmount = 100 * 12;
                break;
            case LifeStage.NURSING:
                welfareAmount = 2000 * 12;
                break;
            case LifeStage.DEATH:
                welfareAmount = 0;
                break;
        }
        this.annualSalary = this.annualSalary + welfareAmount;
        state.get().withdrawWelfare(welfareAmount);
    };
    Citizen.prototype.activePoliticalAction = function (context) {
        switch (context.code) {
            case LifeStage.SUFFRAGE:
            case LifeStage.WORKFORCE:
            case LifeStage.NURSING:
                if (this.age < 16) ;
                else {
                    if (this.annualSalary / 12 > 5000 || this.intelligenceDeviation > 55) {
                        if (number(0, 365 / 3) === 0) {
                            this.submitProposal();
                        }
                    }
                }
                break;
            case LifeStage.DEATH:
                break;
        }
    };
    Citizen.prototype.submitProposal = function () {
        state.get().submitProposal(this, "n" /* NORMAL */);
        this.isBusy = true;
    };
    Citizen.prototype.passivePoliticalAction = function (context) {
        // skip: passive action is automatic in the simulator
    };
    Citizen.prototype.affectByDeliberation = function (point) {
        this.intelligenceDeviation += point;
        this.conspiracyPreference -= point;
        this.cultPreference -= point;
        this.isSocioPath = false;
        this.progressismPreference = 50 * ((this.intelligenceDeviation * this.conspiracyPreference * this.cultPreference) / (50 * 50 * 50)) ^ (1 / 3);
        this.humanrightsPreference += point;
        return this;
    };
    return Citizen;
}());
var CorruptionResistantOfficer = /** @class */ (function (_super) {
    __extends(CorruptionResistantOfficer, _super);
    function CorruptionResistantOfficer(candidate) {
        var _this = this;
        var s = state.get();
        _this = _super.call(this) || this;
        _this.isBusy = candidate.isBusy;
        _this.id = candidate.id;
        _this.annualSalary = candidate.annualSalary;
        _this.intelligenceDeviation = candidate.intelligenceDeviation;
        _this.conspiracyPreference = candidate.conspiracyPreference;
        _this.cultPreference = candidate.cultPreference;
        _this.isSocioPath = candidate.isSocioPath;
        _this.progressismPreference = candidate.progressismPreference;
        _this.humanrightsPreference = candidate.humanrightsPreference;
        _this.biologicallyCanBePregnant = candidate.biologicallyCanBePregnant;
        _this.lifetime = candidate.lifetime;
        _this.age = candidate.age;
        return _this;
    }
    return CorruptionResistantOfficer;
}(Citizen));
var SupremeJudge = /** @class */ (function (_super) {
    __extends(SupremeJudge, _super);
    function SupremeJudge() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return SupremeJudge;
}(CorruptionResistantOfficer));
var Facilitator = /** @class */ (function (_super) {
    __extends(Facilitator, _super);
    function Facilitator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Facilitator;
}(CorruptionResistantOfficer));
var Professional = /** @class */ (function (_super) {
    __extends(Professional, _super);
    function Professional() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Professional;
}(CorruptionResistantOfficer));
var Administration = /** @class */ (function () {
    function Administration() {
        this.id = uuid(40);
        this.headCount = 8 + number(0, 6);
        this.monthlyBudget = __spreadArrays(Array(this.headCount)).map(function (_) { return 3000 + number(0, 2000); })
            .reduce(function (sum, el) { return sum + el; }, 0);
        this.curruption = number(0, 30);
    }
    Administration.prototype.tick = function () {
        this.curruption += number(0, 3) / 10;
    };
    Administration.prototype.validate = function () {
        return { code: "", report: "" };
    };
    return Administration;
}());

var context = describe;
describe('Proposal', function () {
    describe('tick', function () {
        context('ProposalPhases.INITIAL_JUDGE', function () {
            it('should be initialized.', function () {
                var s = state.get();
                var citizen = s.addCitizen();
                var proposal = new Proposal(citizen, "n" /* NORMAL */);
                var validationResult = proposal.validate();
                expect(validationResult.code).toBe("i" /* INITIAL_JUDGE */);
            });
        });
    });
});
//# sourceMappingURL=index.test.js.map
