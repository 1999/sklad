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

    devtool: IS_PRODUCTION_BUILD ? 'source-map' : 'inline-source-map',

    watch: IS_DEVELOPMENT_PROCESS,
    watchOptions: {
        aggregateTimeout: 100
    },

    plugins: [
        new webpack.optimize.ModuleConcatenationPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ]
};

if (IS_PRODUCTION_BUILD) {
    module.exports.plugins.push(
        new webpack.optimize.UglifyJsPlugin()
    );
}
