const commonConfig = require('./webpack-configs/webpack.common');
const webpackMerge = require('webpack-merge');

module.exports = (env) => {
    const envConfig = require(`./webpack-configs/webpack.${env.env}.js`);

    return webpackMerge.smart(commonConfig, envConfig);
}