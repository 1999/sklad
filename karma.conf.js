'use strict';

if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
    throw new Error('No SauceLabs credentials set. ' +
        'Please set SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables ' +
        'and run test again');
}

const customLaunchers = require('./tests/browsers');

module.exports = function (config) {
    // @see https://github.com/karma-runner/karma-sauce-launcher/issues/73
    const sauceLabsStartConnect = process.env.TRAVIS ? false : true;

    const configuration = {
        frameworks: ['jasmine'],

        // open_blocked_evt - safari
        // delete_database - safari
        // close - ie edge
        // insert, upsert, delete - safari, ie11_win10
        // count - safari, ie11_win10
        // get - safari, ie11_win10
        files: [
            'node_modules/promise-polyfill/Promise.js', // ie11 support
            'node_modules/indexeddbshim/dist/indexeddbshim.js', // for safari browsers
            'dist/sklad.uncompressed.js',
            'tests/test_utils.js',
            'tests/interface.js',
            'tests/open.js',
            'tests/open_blocked_evt.js',
            'tests/migration_context.js',
            'tests/delete_database.js',
            'tests/close.js',
            'tests/insert.js',
            'tests/upsert.js',
            'tests/delete.js',
            'tests/clear.js',
            'tests/count.js',
            'tests/get.js'
        ],

        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        reporters: ['mocha', 'saucelabs'],

        plugins: [
            'karma-jasmine',
            'karma-mocha-reporter',
            'karma-sauce-launcher'
        ],

        sauceLabs: {
            startConnect: sauceLabsStartConnect,
            testName: 'Sklad Unit Tests',
            tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
            tags: ['indexeddb', 'clientside']
        },
        captureTimeout: 300000,
        browserDisconnectTimeout: 20000,
        browserNoActivityTimeout: 300000,
        customLaunchers: customLaunchers,
        browsers: Object.keys(customLaunchers)
    };

    config.set(configuration);
};
