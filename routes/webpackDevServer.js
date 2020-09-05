
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const compiler = webpack({
    mode: "development",
    entry: {
        main: "./views/spotifyAppBunddle.js",
    },
    devServer: {
        host: "0.0.0.0",
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
app.use(
    "/spotify/bundle",
    webpackDevMiddleware(compiler, {
        publicPath: "/spotify/bundle",
    })
);