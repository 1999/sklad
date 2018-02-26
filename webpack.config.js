'use strict';

const webpack = require('webpack');
const IS_PRODUCTION_BUILD = (process.env.NODE_ENV === 'production');

module.exports = {
    context: __dirname,
    entry: ['babel-polyfill', './lib/sklad.js'],
    output: {
        path: `${__dirname}/dist`,
        filename: IS_PRODUCTION_BUILD ? 'sklad.min.js' : 'sklad.uncompressed.js',
        library: 'sklad',
        libraryTarget: 'umd',
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                'env',
                                {
                                    targets: {
                                        browsers: ['last 2 versions', 'ie >= 11', 'safari >= 9']
                                    },
                                    // for uglifyjs...
                                    forceAllTransforms: IS_PRODUCTION_BUILD,
                                }
                            ],
                        ],
                        plugins: ['add-module-exports', 'transform-es2015-typeof-symbol']
                    }
                }
            }
        ]
    },
};
