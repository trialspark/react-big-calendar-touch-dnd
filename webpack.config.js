const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './src/index',

  output: {
    path: path.resolve(__dirname, './lib'),
    filename: 'react-big-calendar-touch-dnd.js',
    library: 'reactBigCalendarTouchDnD',
    libraryTarget: 'umd',
  },

  externals: {
    react: {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'react',
      root: 'React',
    },
    'react-dom': {
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      amd: 'react-dom',
      root: 'ReactDOM',
    },
    'react-big-calendar/lib/utils/accessors': {
      commonjs: 'react-big-calendar/lib/utils/accessors',
      commonjs2: 'react-big-calendar/lib/utils/accessors',
    },
    'react-big-calendar/lib/utils/propTypes': {
      commonjs: 'react-big-calendar/lib/utils/propTypes',
      commonjs2: 'react-big-calendar/lib/utils/propTypes',
    },
  },

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

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new UglifyJSPlugin({
      uglifyOptions: {
        compress: true,
        mangle: false,
        beautify: true,
      },
    }),
  ],
};
