import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

export default {
    entry: 'lib/sklad.js',
    dest: 'dist/sklad.jsnext.js',
    format: 'es',
    sourceMap: true
};
