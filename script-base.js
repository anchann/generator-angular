'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var angularUtils = require('./util.js');

var Generator = module.exports = function Generator() {
  yeoman.generators.NamedBase.apply(this, arguments);

  try {
    this.appname = require(path.join(process.cwd(), 'bower.json')).name;
  } catch (e) {
    this.appname = path.basename(process.cwd());
  }
  this.appname = this._.slugify(this._.humanize(this.appname));
  this.scriptAppName = this._.camelize(this.appname) + angularUtils.appName(this);

  this.cameledName = this._.camelize(this.name);
  this.classedName = this._.classify(this.name);

  if (typeof this.env.options.appPath === 'undefined') {
    try {
      this.env.options.appPath = require(path.join(process.cwd(), 'bower.json')).appPath;
    } catch (e) {}
    this.env.options.appPath = this.env.options.appPath || 'app';
  }

  if (typeof this.env.options.testPath === 'undefined') {
    try {
      this.env.options.testPath = require(path.join(process.cwd(), 'bower.json')).testPath;
    } catch (e) {}
    this.env.options.testPath = this.env.options.testPath || 'test/spec';
  }

  var pkg = JSON.parse(this.readFileAsString(path.join(process.cwd(), 'package.json')));

  this.env.options.coffee = this.options.coffee;
  if (typeof this.env.options.coffee === 'undefined') {
    this.option('coffee');

    // attempt to detect if user is using CS or not
    // if cml arg provided, use that; else look for the existence of cs
    if (!this.options.coffee &&
      // TODO check pkg["yo-language"] === "coffee"
      this.expandFiles(path.join(this.env.options.appPath, '/scripts/**/*.coffee'), {}).length > 0) {
      this.options.coffee = true;
    }

    this.env.options.coffee = this.options.coffee;
  }

  if (typeof this.env.options.typescript === 'undefined') {
    this.option('typescript');

    // attempt to detect if user is using typescript or not
    // if cml arg provided, use that; else look for yo-language in package.json
    if (!this.options.typescript && pkg["yo-language"] === "typescript") {
      this.options.typescript = true;
    }

    this.env.options.typescript = this.options.typescript;

    if (this.options.typescript) {
      if (pkg["yo-typescript-appName"]) {
        this.env.options.typescriptAppName = this.options.typescriptAppName = pkg["yo-typescript-appName"];
      }
    }
  }

  if (typeof this.env.options.minsafe === 'undefined') {
    this.option('minsafe');
    this.env.options.minsafe = this.options.minsafe;
  }

  var sourceRoot = '/templates/javascript';
  this.scriptSuffix = '.js';

  if (this.env.options.coffee) {
    sourceRoot = '/templates/coffeescript';
    this.scriptSuffix = '.coffee';
  }

  if (this.env.options.minsafe) {
    sourceRoot += '-min';
  }

  // for now, no min-safe option for typescript, hence the ordering of these if blocks
  if (this.env.options.typescript) {
    sourceRoot = '/templates/typescript';
    this.scriptSuffix = '.ts';
  }

  this.sourceRoot(path.join(__dirname, sourceRoot));
};

util.inherits(Generator, yeoman.generators.NamedBase);

Generator.prototype._dest = function (src) {
  if (src.indexOf('spec/') === 0) {
    src = src.substr(5);
  } else if (src.indexOf('service/') === 0) {
    src = src.substr(8);
  }
  return path.join((this.namespace.join('/') || src), this.name);
};

Generator.prototype.appTemplate = function (src, options) {
  options = options || {};
  var scriptSuffix = options.scriptSuffix || this.scriptSuffix;

  yeoman.generators.Base.prototype.template.apply(this, [
    src + scriptSuffix,
    path.join(this.env.options.appPath, this._dest(src)) + scriptSuffix
  ]);

  if (options.addScriptToIndex !== false) this.addScriptToIndex(src);
};

Generator.prototype.testTemplate = function (src, options) {
  options = options || {};
  var scriptSuffix = options.scriptSuffix || this.scriptSuffix;

  yeoman.generators.Base.prototype.template.apply(this, [
    src + scriptSuffix,
    path.join(this.env.options.testPath, this._dest(src)) + scriptSuffix
  ]);
};

Generator.prototype.htmlTemplate = function (src, dest) {
  yeoman.generators.Base.prototype.template.apply(this, [
    src,
    path.join(this.env.options.appPath, dest)
  ]);
};

Generator.prototype.addScriptToIndex = function (script) {
  try {
    var appPath = this.env.options.appPath;
    var fullPath = path.join(appPath, 'index.html');
    angularUtils.rewriteFile({
      file: fullPath,
      needle: '<!-- endbuild -->',
      splicable: [
        '<script src="scripts/' + script + '.js"></script>'
      ]
    });
  } catch (e) {
    console.log('\nUnable to find '.yellow + fullPath + '. Reference to '.yellow + script + '.js ' + 'not added.\n'.yellow);
  }
};

Generator.prototype.generateSourceAndTest = function (appTemplate, testTemplate, targetDirectory, skipAdd) {
  this.appTemplate(appTemplate, path.join('scripts', targetDirectory, this.name));
  this.testTemplate(testTemplate, path.join(targetDirectory, this.name));
  if (!skipAdd) {
    this.addScriptToIndex(path.join(targetDirectory, this.name));
  }
};
