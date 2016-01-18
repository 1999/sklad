'use strict';

module.exports = {
    context: __dirname,
    entry: './lib/sklad.js',
    output: {
        path: `${__dirname}/dist`,
        filename: 'bundle.js',
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
                    plugins: ['array-includes']
                }
            }
        ]
    },

    // devtool:

    watch: (process.env.NODE_ENV !== 'production'),
    watchOptions: {
        aggregateTimeout: 100
    }
};
