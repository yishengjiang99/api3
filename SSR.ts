'use strict';
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { execSync } from 'child_process';
import { readFileSync, PathLike } from 'fs';
import * as Stream from 'stream';
import { string } from "prop-types";
import * as htmloader from 'html-loader';

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
    templateFiles: []
};

interface Blade {
    component: React.Component | PathLike | String,
    elementId: string,
    dataSource?: URL | string,
    transform?: Stream.Transform,
}
interface Token {
    templateString: string | RegExp
    replaceValue: string
}


export const createEngine = (templateFile) => {
    const fileCache = FSCached();
    let registered = false;
    let moduleDetectRegEx;
    const { file_get_contents } = fileCache;
    const file = require("html-loader?./" + templateFile)
    function prepareTemplate(templateFile) {
        const file = require("html-loader?./" + templateFile)
        templateFile.split()

        if (!templateCache[templateFile]) {
            let content = file_get_content(templateFile)
            let m = null;
            while (m = content.match(preloadTag)) {
                const src = m[1].trim(), type = m[2];
                content = content.replace(preloadTag, `<${type}> ${file_get_contents(src)} </${type}>`);
            }
            templateCache[templateFile] = content;
        }
        return templateCache[templateFile];
    }


    function render(modules: Blade[], res: WritableStream) {

    }

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
                { ...{ only: [].concat(options.settings.views) }, engineOptions.babel }
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
        cb(null, markup);
    }
    return renderFile;
}

const FSCached = () => {
    const fscache = {};

    function httpsGetSync(url) {
        const content = execSync(`curl '${url}'`);
        return content;
    }

    function file_get_contents(filename) {
        if (!filename) return "";

        fscache[filename] = fscache[filename]
            || (filename.startsWith("http") && httpsGetSync(filename))
            || readFileSync(resolve("views", filename)).toString();
        return fscache[filename];
    };
    return {
        fileCache: new Proxy(fscache, {
            get: (name) => file_get_contents(name)
        }),
        file_get_contents,
        httpsGetSync
    }
}