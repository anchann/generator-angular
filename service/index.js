'use strict';
var util = require('util');
var ScriptBase = require('../script-base.js');


module.exports = Generator;

function Generator(args, options) {
  ScriptBase.apply(this, arguments);
  this._.extend(this, options.userChoices);

  if (this.name && this.name.toLowerCase() !== 'service' && this.name.substr(-7).toLowerCase() === 'service') {
    this.name = this.name.slice(0, -7);
  }

  if (this.options.typescript) {
    this.typescriptAppName  = this.typescriptAppName || this.options.typescriptAppName;
    this.tsAngularName = this._.camelize(this.name) + "Service";
    this.tsClassName   = this._.classify(this.name) + "Service";
  }
}

util.inherits(Generator, ScriptBase);

Generator.prototype.createServiceFiles = function createServiceFiles() {
  this.generateSourceAndTest(
    'service/service',
    'spec/service',
    'services',
    this.options['skip-add'] || false
  );
};
