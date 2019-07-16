const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: './src/main/resources/public/app.module.ts',
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, '../', 'target', 'classes', 'build')
    },
    node: {
        fs: "empty"
    },
    module: {
        rules: [
            {
                test: /\.g4/,
                loader: 'antlr4-webpack-loader',
                options: {
                    lib: 'src/main/resources/public/vendor/antlr4'
                }
            },
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
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
            minChunks(module, count) {
                var context = module.context;
                return context && context.indexOf('node_modules') >= 0;
            }
        }),
        new CopyWebpackPlugin([
            { from: 'src/main/resources/public/images', to: 'images' }
        ])
    ]
}