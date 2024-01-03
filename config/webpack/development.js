const environment = require("./environment");
const webpack = require("webpack");

// const less = require("./loaders/less");

environment.plugins.insert(
    "Ignore",
    new webpack.IgnorePlugin(/^\.\/locale*/, /moment$/),
    { before: "manifest" }
);

// environment.loaders.append("less", less);

module.exports = environment.toWebpackConfig();
