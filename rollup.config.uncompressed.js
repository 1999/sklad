import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
    entry: 'lib/sklad.js',
    dest: 'dist/sklad.uncompressed.js',
    format: 'umd',
    moduleId: 'sklad',
    moduleName: 'sklad',
    sourceMap: true,
    plugins: [
        nodeResolve({
            jsnext: true,
            // main: true
        }),
        babel({
            presets: ['es2015-rollup'],
            // plugins: ['add-module-exports', 'transform-es2015-typeof-symbol']
        })
    ]
};
