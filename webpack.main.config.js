const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/main/main.ts',
  target: 'electron-main',
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: /src/,
        use: [{ loader: 'ts-loader' }]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, './dist/main'),
    filename: 'main.js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@database': path.resolve(__dirname, 'src/database'),
      '@services': path.resolve(__dirname, 'src/services')
    }
  },
  node: {
    __dirname: false,
    __filename: false
  },
  externals: {
    'better-sqlite3': 'commonjs better-sqlite3',
    'electron-store': 'commonjs electron-store'
  }
};
