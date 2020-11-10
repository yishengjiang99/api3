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
var React = require("react");
var ReactDOMServer = require("react-dom/server");
var child_process_1 = require("child_process");
var path_1 = require("path");
var fs_1 = require("fs");
var register_1 = require("@babel/register");
var fscache = {};
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
            fs_1.readFileSync(path_1.resolve("views", filename)).toString();
    return fscache[filename];
}
module.exports = function (props) {
    if (props === void 0) { props = {}; }
    var defaults = { layout: null, preloadCss: [], preloadJS: [] };
    var _a = __assign(__assign({}, defaults), props), layout = _a.layout, preloadCss = _a.preloadCss, preloadJS = _a.preloadJS;
    var registered = false;
    if (layout)
        file_get_contents(layout);
    for (var _i = 0, preloadCss_1 = preloadCss; _i < preloadCss_1.length; _i++) {
        var filename = preloadCss_1[_i];
        file_get_contents(filename);
    }
    for (var _b = 0, preloadJS_1 = preloadJS; _b < preloadJS_1.length; _b++) {
        var filename = preloadJS_1[_b];
        file_get_contents(filename);
    }
    return function renderFile(filename, options, cb) {
        !registered &&
            register_1.register({ presets: ["@babel/preset-react", "@babel/preset-env"] });
        registered = true;
        try {
            var layouts = file_get_contents(layout).split("__MAIN__");
            var markup = layouts[0];
            for (var _i = 0, preloadCss_2 = preloadCss; _i < preloadCss_2.length; _i++) {
                var filename_1 = preloadCss_2[_i];
                markup += "<style>" + file_get_contents(filename_1) + "</style>";
            }
            for (var _a = 0, preloadJS_2 = preloadJS; _a < preloadJS_2.length; _a++) {
                var filename_2 = preloadJS_2[_a];
                markup += markup +=
                    "<script>" + file_get_contents(filename_2) + "</script>";
            }
            var component = require(filename);
            // Transpiled ES6 may export components as { default: Component }
            component = component["default"] || component;
            markup += ReactDOMServer.renderToStaticMarkup(React.createElement(component, options, []));
            markup += layouts[1] || "";
        }
        catch (e) {
            return cb(e);
        }
        cb(null, markup);
    };
};
