"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.renderInline = exports.createEngine = void 0;
var React = require("react");
var ReactDOMServer = require("react-dom/server");
var child_process_1 = require("child_process");
var assign = require("object-assign");
var fs_1 = require("fs");
var resolve = require("path").resolve;
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
                        node: "current"
                    }
                },
            ],
        ],
        plugins: ["@babel/transform-flow-strip-types"]
    },
    preloadJS: [],
    templateFiles: []
};
exports.createEngine = function () {
    var registered = false;
    var moduleDetectRegEx;
    var fscache = {};
    var templateCache = {};
    var preloadTag = /<preload type='(.*?)' src='(.*?)' \/\>/;
    function httpsGetSync(url) {
        var content = child_process_1.execSync("curl '" + url + "'");
        return content;
    }
    function file_get_contents(filename) {
        if (!filename)
            return "";
        fscache[filename] =
            fscache[filename] ||
                (filename.startsWith("http") && httpsGetSync(filename)) ||
                fs_1.readFileSync(resolve("views", filename)).toString();
        return fscache[filename];
    }
    function prepareTemplate(templateFile) {
        if (!templateCache[templateFile]) {
            var content = file_get_contents(templateFile);
            var m = null;
            while ((m = content.match(preloadTag))) {
                var src = m[1].trim(), type = m[2];
                content = content.replace(preloadTag, "<" + type + "> " + file_get_contents(src) + " </" + type + ">");
            }
            templateCache[templateFile] = content;
        }
        return templateCache[templateFile];
    }
    var engineOptions = __assign(__assign({}, DEFAULT_OPTIONS), { engineOptions: engineOptions }); // assign({}, DEFAULT_OPTIONS, engineOptions || {});
    for (var _i = 0, _a = engineOptions.preloadJS; _i < _a.length; _i++) {
        var filename = _a[_i];
        file_get_contents(filename);
    }
    for (var _b = 0, _c = engineOptions.templateFiles; _b < _c.length; _b++) {
        var filename = _c[_b];
        prepareTemplate(filename);
    }
    function renderFile(filename, options, cb) {
        // Defer babel registration until the first request so we can grab the view path.
        if (!moduleDetectRegEx) {
            // Path could contain regexp characters so escape it first.
            // options.settings.views could be a single string or an array
            moduleDetectRegEx = new RegExp([]
                .concat(options.settings.views)
                .map(function (viewPath) { return "^" + viewPath; })
                .join("|"));
        }
        if (engineOptions.transformViews && !registered) {
            // Passing a RegExp to Babel results in an issue on Windows so we'll just
            // pass the view path.
            require("@babel/register")(assign({ only: [].concat(options.settings.views) }, engineOptions.babel));
            registered = true;
        }
        try {
            var markup = engineOptions.doctype;
            var component = require(filename);
            // Transpiled ES6 may export components as { default: Component }
            component = component["default"] || component;
            markup += ReactDOMServer.renderToStaticMarkup(React.createElement(component, options, []));
        }
        catch (e) {
            return cb(e);
        }
        finally {
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
exports.renderInline = function (markup, output) { };
