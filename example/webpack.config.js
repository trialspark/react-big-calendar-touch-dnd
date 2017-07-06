const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, './src/index'),

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
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(__dirname, './static/index.html'),
    }),
  ],

  devServer: {
    publicPath: '/',
    port: 3000,
    watchContentBase: true,
    host: '0.0.0.0',
    disableHostCheck: true,
  },
};
