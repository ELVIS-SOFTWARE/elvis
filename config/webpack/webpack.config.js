// See the shakacode/shakapacker README and docs directory for advice on customizing your webpackConfig.
const { generateWebpackConfig } = require('shakapacker')
const webpack = require("webpack");

const options = {
    resolve: {
        extensions: ['.css', '.scss', '.js', '.jsx'],
        plugins: [
            new webpack.ProvidePlugin({
                $: "jquery",
                jQuery: "jquery",
                jquery: "jquery",
                "window.jQuery": "jquery",
            })
        ]
    }
}

const webpackConfig = generateWebpackConfig(options)

module.exports = webpackConfig
