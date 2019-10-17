const webpack = require('webpack');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const extractCSS = new ExtractTextWebpackPlugin('vendor.css');
const extractSCSS = new ExtractTextWebpackPlugin('app.css');

module.exports = {
    entry: {
        app: './src/main/resources/public/main.aot.ts'
    },
    output: {
        filename: '[name].[hash].js'
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: '@ngtools/webpack',
                exclude: [
                    /node_modules/,
                    path.resolve(__dirname, './src/main/resources/public/main.ts')
                ]
            },
            {
                test: /\.css?$/,
                use: extractCSS.extract('css-loader')
            },
            {
                test: /\.scss?$/,
                use: extractSCSS.extract(['css-loader', 
                {
                    loader: 'postcss-loader',
                    options: {
                        ident: 'postcss',
                        plugins: [
                            require('autoprefixer')()
                        ]
                    }
                },
                'sass-loader'])
            }
        ]
    },
    plugins: [
        extractCSS,
        extractSCSS,
        new ngToolsWebpack.AotPlugin({
            tsConfigPath: './tsconfig.aot.json',
            entryModule: path.resolve(__dirname, '../src/main/resources/public/app.module.ts#AppModule')
        }),
        new OptimizeCSSAssetsPlugin({
            assetNameRegExp: /\.css$/g,
            cssProcessor: require('cssnano'),
            cssProcessorOptions: {
                discardComments: {
                    removeAll: true
                }
            },
            canPrint: true
        }),
        new UglifyJsPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            filename: '[name].[hash].js',
            minChunks(module, count) {
                var context = module.context;
                return context && context.indexOf('node_modules') >= 0;
            }
        })
    ]
};