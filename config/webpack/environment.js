const { environment } = require("@rails/webpacker");
const webpack = require("webpack");

environment.plugins.append(
    "Provide",
    new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
        jquery: "jquery",
        "window.jQuery": "jquery",
    })
);

// environment.loaders.append("less", {
//     test: /\.less$/,
//     use: [
//         // "style-loader",
//         { loader: "css-loader", options: { sourceMap: 1 } },
//         "less-loader",
//     ],
// });

module.exports = environment;
