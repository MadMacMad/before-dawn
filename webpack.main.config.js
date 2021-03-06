'use strict'

const path = require('path');
const packageJSON = require('./package.json');

const dependencies = packageJSON.dependencies;
const optionalDependencies = packageJSON.optionalDependencies;
const webpack = require('webpack');

const outputDir = path.join(__dirname, "output");

const BabiliWebpackPlugin = require('babili-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin');

//
// get a list of node dependencies, and then
// convert it to an array of package names
// this prevents some warnings like:
//
//   Critical dependency: the request of a dependency is an expression
//
// and
//
//   ERROR in ./src/main/fullscreen.js
//   Module not found: Error: Can't resolve 'winctl'
//
// Basically, webpack falls down when you're including node modules
const deps = [].concat(
  Object.keys(dependencies),
  Object.keys(optionalDependencies)
);


let mainConfig = {
  devtool: '#source-map',
  mode: (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
  entry: {
    main: path.join(__dirname, 'src/main/index.js')
  },
  externals: deps,
  module: {
    rules: [
      {
        test: /\.(js)$/,
        enforce: 'pre',
        exclude: [
          /node_modules/,
          /lib/
        ],
        use: {
          loader: 'eslint-loader',
          options: {
            formatter: require('eslint-friendly-formatter')
          }
        }
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  },
  node: {
    __dirname: false,
    __filename: false
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: outputDir,
    sourceMapFilename: "[name].js.map"
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'package.json'),
        to: path.join(outputDir)
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'src', 'main', 'assets'),
        to: path.join(outputDir, 'assets'),
        ignore: ['.*']
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'src', 'bin'),
        to: path.join(outputDir, 'bin'),
        ignore: ['.*']
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'src', 'system-savers'),
        to: path.join(outputDir, 'system-savers'),
        ignore: ['.*']
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'src', 'main', '__template'),
        to: path.join(outputDir, '__template'),
        ignore: ['.*']
      }
    ]),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  resolve: {
    extensions: ['.js', '.json', '.node']
  },
  target: 'electron-main'
}

/**
 * Adjust mainConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
  mainConfig.plugins.push(
    new webpack.DefinePlugin({
      '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`
    })
  )
}

/**
 * Adjust mainConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  mainConfig.plugins.push(
    new BabiliWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    })
  )
}

module.exports = mainConfig
