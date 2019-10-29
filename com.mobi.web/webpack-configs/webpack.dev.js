const path = require('path');

module.exports = {
    devtool: 'source-map',
    devServer: {
        contentBase: './',
        port: 9000,
    },
    module: { 
        rules: [
            {
                test: /\.ts?$/,
                use: [
                    'ts-loader',
                    'angular2-template-loader'
                ],
                exclude: [
                    /node_modules/,
                    path.resolve(__dirname, './src/main/resources/public/main.aot.ts')
                ]
            }
        ]
    }
};