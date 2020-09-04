import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { execSync } from "child_process";

var assign = require("object-assign");
import { readFileSync } from "fs";

const { resolve } = require("path");
const DEFAULT_OPTIONS = {
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
  preloadJS: [],
  templateFiles: [],
};

export const createEngine = () => {
  var registered = false;
  var moduleDetectRegEx;

  const fscache = {};
  const templateCache = {};
  const preloadTag = /<preload type='(.*?)' src='(.*?)' \/\>/;

  function httpsGetSync(url) {
    const content = execSync(`curl '${url}'`);
    return content;
  }

  function file_get_contents(filename) {
    if (!filename) return "";
    fscache[filename] =
      fscache[filename] ||
      (filename.startsWith("http") && httpsGetSync(filename)) ||
      readFileSync(resolve("views", filename)).toString();
    return fscache[filename];
  }
  function prepareTemplate(templateFile) {
    if (!templateCache[templateFile]) {
      let content = file_get_contents(templateFile);
      let m = null;
      while ((m = content.match(preloadTag))) {
        const src = m[1].trim(),
          type = m[2];
        content = content.replace(
          preloadTag,
          `<${type}> ${file_get_contents(src)} </${type}>`
        );
      }
      templateCache[templateFile] = content;
    }
    return templateCache[templateFile];
  }

  var engineOptions = { ...DEFAULT_OPTIONS, engineOptions }; // assign({}, DEFAULT_OPTIONS, engineOptions || {});

  for (const filename of engineOptions.preloadJS) file_get_contents(filename);
  for (const filename of engineOptions.templateFiles) prepareTemplate(filename);

  function renderFile(filename, options, cb) {
    // Defer babel registration until the first request so we can grab the view path.
    if (!moduleDetectRegEx) {
      // Path could contain regexp characters so escape it first.
      // options.settings.views could be a single string or an array
      moduleDetectRegEx = new RegExp(
        []
          .concat(options.settings.views)
          .map((viewPath) => "^" + viewPath)
          .join("|")
      );
    }

    if (engineOptions.transformViews && !registered) {
      // Passing a RegExp to Babel results in an issue on Windows so we'll just
      // pass the view path.
      require("@babel/register")(
        assign({ only: [].concat(options.settings.views) }, engineOptions.babel)
      );
      registered = true;
    }

    try {
      var markup = engineOptions.doctype;
      var component = require(filename);
      // Transpiled ES6 may export components as { default: Component }
      component = component.default || component;
      markup += ReactDOMServer.renderToStaticMarkup(
        React.createElement(component, options, [])
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

    if (options.layout) {
      markup = prepareTemplate(options.layout);
    }

    if (options.mainJS) {
      markup = markup.replace("__MAIN_JS__", file_get_contents(options.mainJS));
    }

    cb(null, markup);
  }

  return renderFile;
};

export const renderInline = function (
  markup: string,
  output: WritableStream
) { };
