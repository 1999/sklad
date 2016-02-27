'use strict';

if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
    throw new Error('No SauceLabs credentials set. ' +
        'Please set SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables ' +
        'and run test again');
}

const customLaunchers = require('./tests/browsers');

module.exports = function (config) {
    const configuration = {
        frameworks: ['jasmine'],

        files: [
            'node_modules/es6-promise/dist/es6-promise.js', // ie11 support
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
