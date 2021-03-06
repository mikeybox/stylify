/* jshint node: true */
'use strict';

/**
  # stylify

  browserify v2 plugin for [stylus](https://github.com/LearnBoost/stylus).

  ## Example Usage

  Usage is very simple when combined with the
  [insert-css](https://github.com/substack/insert-css) (or similar) module.
  Consider the following example, which dynamically creates a couple of
  div tags, and dynamically assigned styles:

  <<< examples/simple.js

  You can see the final statement uses a familar node `require` call to 
  bring in a stylus stylesheet:

  <<<css examples/simple.styl

**/

var stylus = require('stylus');
var cleanCss = require('clean-css');
var through = require('through');
var glob = require('glob');
var _ = require('lodash');

var appPackage = require(process.cwd() + '/package.json');


var paths = null;

if(!!appPackage.stylify && appPackage.stylify.paths instanceof Array){
  paths = _.chain(
    appPackage.stylify.paths.map(function(path){
      return glob.sync(path);
    })
  )
  .flatten()
  .uniq()
  .value();
}

function compile(file, data) {

  var style = stylus(data, { filename: file });
  if(!!paths) { 
    style.set('paths', paths); 
  }
  var compiled = style.render();
  var minified = (new cleanCss).minify(compiled);

  return 'module.exports = ' + JSON.stringify(minified) + ';';
}

module.exports = function (file) {
  var data = '';

  function write (buf) {
    data += buf;
  }

  function end () {
    this.queue(compile(file, data));
    this.queue(null);
  }

  if (!/\.styl$/.test(file)) return through();

  return through(write, end);
};