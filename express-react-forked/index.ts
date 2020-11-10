import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { execSync } from "child_process";
import { resolve } from "path";
import { readFileSync } from "fs";
import { register } from "@babel/register";

const fscache = {};
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
module.exports = (
	props: {
		layout?: string;
		preloadCss?: string[];
		preloadJS?: string[];
	} = {}
) => {
	const defaults = { layout: null, preloadCss: [], preloadJS: [] };
	const { layout, preloadCss, preloadJS } = { ...defaults, ...props };
	var registered = false;
	if (layout) file_get_contents(layout);
	for (const filename of preloadCss) file_get_contents(filename);
	for (const filename of preloadJS) file_get_contents(filename);
	return function renderFile(filename, options, cb) {
		!registered &&
			register({ presets: ["@babel/preset-react", "@babel/preset-env"] });
		registered = true;
		try {
			const layouts = file_get_contents(layout).split("__MAIN__");
			var markup = layouts[0];
			for (const filename of preloadCss)
				markup += "<style>" + file_get_contents(filename) + "</style>";
			for (const filename of preloadJS)
				markup += markup +=
					"<script>" + file_get_contents(filename) + "</script>";

			var component = require(filename);
			// Transpiled ES6 may export components as { default: Component }
			component = component.default || component;
			markup += ReactDOMServer.renderToStaticMarkup(
				React.createElement(component, options, [])
			);
			markup += layouts[1] || "";
		} catch (e) {
			return cb(e);
		}
		cb(null, markup);
	};
};
