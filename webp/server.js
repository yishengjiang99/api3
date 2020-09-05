
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const app = express();
const config = require('./webpack.config.js');
const compiler = webpack({
    mode: 'development',
    entry: {
        main: "./spotifyAppBundle.js"
    },
    devServer: {
        host: '0.0.0.0',
        port: '3000'
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: require.resolve("babel-loader"),
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.png|svg|jpg|gif$/,
                use: ["file-loader"],
            },
        ],
    },
});
const wpd = webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
});
app.use(wpd);
// Serve the files on port 3000.
app.listen(3000, function () {
    console.log('Example app listening on port 3000!\n');
});
