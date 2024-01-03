const environment = require("./environment");
const webpack = require("webpack");

environment.plugins.insert(
    "Ignore",
    new webpack.IgnorePlugin(/^\.\/locale*/, /moment$/),
    { before: "manifest" }
);

module.exports = environment.toWebpackConfig();