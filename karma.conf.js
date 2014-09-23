module.exports = function (config) {
    config.set({
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

        // browsers: ['Chrome', 'ChromeCanary', 'Firefox']
    });
};

// // Karma configuration
// // Generated on Tue Sep 16 2014 01:17:35 GMT+0400 (MSK)

// module.exports = function(config) {
//   config.set({

//     // base path that will be used to resolve all patterns (eg. files, exclude)
//     basePath: '',


//     // frameworks to use
//     // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
//     frameworks: ['jasmine', 'requirejs'],


//     // Continuous Integration mode
//     // if true, Karma captures browsers, runs the tests and exits
//     singleRun: false
//   });
// };
