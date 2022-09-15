const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: {
        app: './src/main/resources/public/main.ts'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, '../', 'target', 'classes', 'build')
    },
    node: {
        fs: 'empty'
    },
    module: {
        rules: [
            {
                test: /\.css?$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.scss?$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.(woff|woff2|eot|ttf|svg)$/,
                use: 'file-loader'
            },
            {
                test: require.resolve('snapsvg'),
                use: 'imports-loader?this=>window,fix=>module.exports=0',
            },
            {
                test: /\.html$/,
                use: 'raw-loader'
            },
            {
                test: /spec\.(j|t)s$/,
                exclude: /node_modules/,
                use: [
                    {
                      loader: 'eslint-loader',
                      options: {
                        quiet: true,
                        failOnError: true,
                      }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/main/resources/public/index.html'
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            filename: '[name].bundle.js',
            minChunks(module) {
                const context = module.context;
                return context && context.indexOf('node_modules') >= 0;
            }
        }),
        new CopyWebpackPlugin([
            { from: 'src/main/resources/public/images', to: 'images'},
            { from: 'src/main/resources/public/css/Material_Icons', to: 'css/Material_Icons'}
            
        ])
    ]
}