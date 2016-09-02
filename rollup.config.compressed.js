import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

export default {
    entry: 'lib/sklad.js',
    dest: 'dist/sklad.min.js',
    format: 'umd',
    moduleId: 'sklad',
    moduleName: 'sklad',
    sourceMap: true,
    plugins: [
        nodeResolve({
            jsnext: true,
            main: true
        }),
        babel({
            presets: ['es2015-rollup'],
            // plugins: ['add-module-exports', 'transform-es2015-typeof-symbol']
        }),
        uglify()
    ]
};
