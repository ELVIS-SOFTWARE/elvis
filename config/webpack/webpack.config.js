// See the shakacode/shakapacker README and docs directory for advice on customizing your webpackConfig.
const { generateWebpackConfig } = require('shakapacker')
const webpack = require("webpack");

const options = {
    resolve: {
        extensions: ['.css', '.scss', '.js', '.jsx'],
        alias: {
            jquery: 'jquery/src/jquery',
            React: 'react',
            ReactDOM: 'react-dom',
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
        }),
    ],
}

const webpackConfig = generateWebpackConfig(options)

module.exports = webpackConfig
