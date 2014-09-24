module.exports = function (config) {
    var configuration = {
        frameworks: ['jasmine'],

        files: [
            'sklad.js',
            'tests/*.js'
        ],

        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        reporters: ['progress'],

        plugins: [
            'karma-jasmine',
            'karma-chrome-launcher',
            'karma-firefox-launcher'
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
