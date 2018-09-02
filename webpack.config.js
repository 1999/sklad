'use strict';

module.exports = (env, { mode }) => ({
    context: __dirname,
    entry: './lib/sklad.js',
    output: {
        path: `${__dirname}/dist`,
        filename: (mode === 'production') ? 'sklad.min.js' : 'sklad.uncompressed.js',
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
                                '@babel/preset-env',
                                {
                                    targets: {
                                        browsers: ['last 2 versions', 'ie >= 11', 'safari >= 9']
                                    },
                                }
                            ],
                        ],
                        plugins: ['add-module-exports']
                    }
                }
            }
        ]
    },
});
