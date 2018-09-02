module.exports = {
    // Chrome
    chrome_stable_osx: {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'OS X 10.11',
        version: '66'
    },
    chrome_stable_win: {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Windows 10',
        version: '66'
    },
    chrome_stable_linux: {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Linux',
        version: '60'
    },

    // Firefox
    firefox_stable_osx: {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'OS X 10.11',
        version: '60'
    },
    firefox_stable_win: {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Windows 10',
        version: '60'
    },
    firefox_stable_linux: {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Linux',
        version: '60'
    },

    // Safari
    safari_9_osx_10_11: {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.11',
        version: '9'
    },

    // SauceLabs has no Safari@9
    // safari_9_ios: {
    //     base: 'SauceLabs',
    //     browserName: 'iphone',
    //     version: ''
    // },

    // IE
    ie11_windows_10: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 10',
        version: '11'
    },
    ie11_windows_8: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 8.1',
        version: '11'
    },
    ie_edge_windows_10: {
        base: 'SauceLabs',
        browserName: 'MicrosoftEdge',
        platform: 'Windows 10'
    },

    // Android Browser
    android_5_1: {
        base: 'SauceLabs',
        browserName: 'android',
        version: '5.1'
    }
};
