// Copyright (c) 2018 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// NOTE: To use this example standalone (e.g. outside of deck.gl repo)
// delete the local development overrides at the bottom of this file

// avoid destructuring for older Node version support
const resolve = require('path').resolve;
const join = require('path').join;
const CleanWebpackPlugin = require('clean-webpack-plugin'); //installed via npm
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    // bundle app.js and everything it imports, recursively.
    entry: {
        app: resolve('./src/main.js')
    },
    output: {
        path: resolve('', './build'),
        filename: 'bundle.[hash].js'
    },

    devtool: 'source-map',


    resolve: {
        // Make src files outside of this dir resolve modules in our node_modules folder
        modules: [resolve(__dirname, '.'), resolve(__dirname, 'node_modules'), 'node_modules']
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                include: join(__dirname, 'src'),
                exclude: [/node_modules/]
            },
            {
                // The example has some JSON data
                test: /\.json$/,
                loader: 'json-loader',
                exclude: [/node_modules/]
            }

        ]
    },

    node: {
        fs: 'empty'
    },

    // Optional: Enables reading mapbox token from environment variable
    plugins: [
        new CleanWebpackPlugin([resolve('', './build')],{ verbose:  true,}),
        new webpack.EnvironmentPlugin(['MapboxAccessToken']),
        new HtmlWebpackPlugin({
            title: 'Custom template',
            // Load a custom template (lodash by default see the FAQ for details)
            template: './src/index.html'
        })
    ]
};

// // This line enables bundling against src in this repo rather than installed deck.gl module
// module.exports = env => {
//   return env ? require('../webpack.config.local')(CONFIG, __dirname)(env) : CONFIG;
// };