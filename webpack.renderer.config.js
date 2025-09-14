const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/renderer/index.tsx',
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: /src/,
        use: [{ 
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.renderer.json'
          }
        }]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: 'asset/resource'
      }
    ]
  },
  devServer: {
    port: 3333,
    hot: true,
    compress: true,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    allowedHosts: 'all'
  },
  output: {
    path: path.resolve(__dirname, './dist/renderer'),
    filename: 'js/[name].[contenthash].js',
    publicPath: process.env.NODE_ENV === 'development' ? '/' : './',
    clean: true,
    globalObject: 'this'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html'
    })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@agents': path.resolve(__dirname, 'src/agents'),
      '@api': path.resolve(__dirname, 'src/api')
    }
  }
};
