const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    main: './src/main/main.ts',
    preload: './src/main/preload.ts'
  },
  target: 'electron-main',
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: /src/,
        use: [{ 
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.main.json'
          }
        }]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, './dist/main'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@database': path.resolve(__dirname, 'src/database'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@agents': path.resolve(__dirname, 'src/agents'),
      '@api': path.resolve(__dirname, 'src/api')
    }
  },
  node: {
    __dirname: false,
    __filename: false
  },
  externals: {
    'sqlite3': 'commonjs sqlite3',
    'electron-store': 'commonjs electron-store'
  }
};
