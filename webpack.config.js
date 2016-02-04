'use strict';

const webpack = require('webpack');
const IS_DEVELOPMENT_PROCESS = (process.env.IS_DEVELOPMENT_PROCESS === '1');
const IS_PRODUCTION_BUILD = (process.env.NODE_ENV === 'production');

module.exports = {
    context: __dirname,
    entry: './lib/sklad.js',
    output: {
        path: `${__dirname}/dist`,
        filename: IS_PRODUCTION_BUILD ? 'sklad.min.js' : 'sklad.uncompressed.js',
        library: 'sklad',
        libraryTarget: 'umd',
    },

    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel',
                query: {
                    presets: ['es2015'],
                    plugins: ['add-module-exports', 'transform-es2015-typeof-symbol']
                }
            }
        ]
    },

    devtool: IS_PRODUCTION_BUILD ? 'source-map' : 'inline-source-map',

    watch: IS_DEVELOPMENT_PROCESS,
    watchOptions: {
        aggregateTimeout: 100
    },

    plugins: [
        new webpack.NoErrorsPlugin()
    ]
};

if (IS_PRODUCTION_BUILD) {
    module.exports.plugins.push(
        new webpack.optimize.UglifyJsPlugin()
    );
}
