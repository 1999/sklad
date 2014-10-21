module.exports = function (config) {
    var configuration = {
        frameworks: ['jasmine'],

        files: [
            'sklad.js',
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
        reporters: ['mocha'],

        plugins: [
            'karma-jasmine',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-mocha-reporter'
        ],

        customLaunchers: {
            Chrome_travis_ci: {
                base: 'Chrome',
                flags: ['--no-sandbox']
            }
        },

        // browsers: ['Chrome', 'ChromeCanary', 'Firefox']
    };

    // run chrome in travis
    // @link https://github.com/karma-runner/karma/issues/1144
    if (process.env.TRAVIS) {
        configuration.browsers = ['Chrome_travis_ci', 'Firefox'];
    }

    config.set(configuration);
};
