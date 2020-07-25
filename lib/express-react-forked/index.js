/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

var React = require("react");
var ReactDOMServer = require("react-dom/server");
var beautifyHTML = require("js-beautify").html;
var assign = require("object-assign");
var _escaperegexp = require("lodash.escaperegexp");


const {readFileSync} = require("fs");
const {resolve} = require("path");

const fscache = {};
const httpsGetSync = (url) => require("child_process").execSync(`curl '${url}'`);
const file_get_contents = (filename) => {
  fscache[filename] = fscache[filename] ||
    (filename.startsWith("https") && httpsGetSync(filename)) ||
    readFileSync(resolve("views", filename)).toString();
  return fscache[filename];
};

var DEFAULT_OPTIONS = {
  doctype: "<!DOCTYPE html>",
  beautify: false,
  transformViews: true,
  babel: {
    presets: [
      "@babel/preset-react",
      [
        "@babel/preset-env",
        {
          targets: {
            node: "current",
          },
        },
      ],
    ],
    plugins: ["@babel/transform-flow-strip-types"],
  },
};

function createEngine(engineOptions) {
  var registered = false;
  var moduleDetectRegEx;

  engineOptions = assign({}, DEFAULT_OPTIONS, engineOptions || {});

  function renderFile(filename, options, cb) {
    // Defer babel registration until the first request so we can grab the view path.
    if (!moduleDetectRegEx) {
      // Path could contain regexp characters so escape it first.
      // options.settings.views could be a single string or an array
      moduleDetectRegEx = new RegExp(
        []
          .concat(options.settings.views)
          .map((viewPath) => "^" + _escaperegexp(viewPath))
          .join("|")
      );
    }

    if (engineOptions.transformViews && !registered) {
      // Passing a RegExp to Babel results in an issue on Windows so we'll just
      // pass the view path.
      require("@babel/register")(
        assign({only: [].concat(options.settings.views)}, engineOptions.babel)
      );
      registered = true;
    }

    try {
      var markup = engineOptions.doctype;
      var component = require(filename);
      // Transpiled ES6 may export components as { default: Component }
      component = component.default || component;
      markup += ReactDOMServer.renderToStaticMarkup(
        React.createElement(component, options)
      );
    } catch (e) {
      return cb(e);
    } finally {
      if (options.settings.env === "development") {
        // Remove all files from the module cache that are in the view folder.
        Object.keys(require.cache).forEach(function (module) {
          if (moduleDetectRegEx.test(require.cache[module].filename)) {
            delete require.cache[module];
          }
        });
      }
    }

    if (engineOptions.beautify) {
      // NOTE: This will screw up some things where whitespace is important, and be
      // subtly different than prod.
      markup = beautifyHTML(markup);
    }

    if (options.layout) {
      markup = file_get_contents(options.layout).replace("__MAIN__", markup);
    }

    if (options.mainJS) {
      markup = markup.replace("__MAIN_JS__", file_get_contents(options.mainJS));
    }
    // __PRELOAD__ https://raw.githubusercontent.com/1j01/simple-console/master/simple-console.js __PRELOAD__
    const preload = (m = markup.match(/__PRELOAD__ (.*?) __PRELOAD__/)) && m[1];
    console.log(preload);
    if (preload) markup = markup.replace(/__PRELOAD__ (.*?) __PRELOAD__/, "<script>" + file_get_contents(preload.trim()) + "</script>");
    cb(null, markup);
  }

  return renderFile;
}

exports.createEngine = createEngine;
