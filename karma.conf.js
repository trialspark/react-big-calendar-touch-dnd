// Karma configuration
// Generated on Thu Jun 29 2017 09:53:30 GMT-0400 (EDT)

module.exports = function configure(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      { pattern: 'setup.karma.js', watched: false },
      { pattern: 'src/**/*.spec.jsx', watched: false },
    ],


    // list of files to exclude
    exclude: [

    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'setup.karma.js': ['webpack'],
      'src/**/*.spec.jsx': ['webpack'],
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values:
    //   config.LOG_DISABLE ||
    //   config.LOG_ERROR ||
    //   config.LOG_WARN ||
    //   config.LOG_INFO ||
    //   config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['BigChromeHeadless'],

    customLaunchers: {
      BigChromeHeadless: {
        base: 'ChromeHeadless',
        flags: ['--window-size=1024x768'],
      },
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    webpack: {
      resolve: {
        extensions: ['.js', '.jsx'],
      },

      module: {
        rules: [
          { test: /.jsx?$/, exclude: /node_modules/, loader: 'babel-loader' },
          {
            test: /.less$/,
            use: [
              { loader: 'style-loader' },
              { loader: 'css-loader' },
              { loader: 'less-loader' },
            ],
          },
        ],
      },
      externals: {
        cheerio: 'window',
        'react/addons': 'react',
        'react/lib/ExecutionEnvironment': 'react',
        'react/lib/ReactContext': 'react',
      },
    },

    webpackMiddleware: {
      stats: 'errors-only',
    },

    devtool: 'cheap-eval-source-map',
  });
};
