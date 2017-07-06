const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './src/index',

  output: {
    path: path.resolve(__dirname, './lib'),
    filename: 'react-big-calendar-touch-dnd.js',
  },

  externals: [
    'react',
    'react-dom',
    /^react-big-calendar\/.+$/,
  ],

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
      compress: true,
      mangle: false,
      beautify: true,
    }),
  ],
};
