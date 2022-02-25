const commonConfig = require('./webpack-configs/webpack.common');
const webpackMerge = require('webpack-merge');

const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();

module.exports = (env) => {
    const envConfig = require(`./webpack-configs/webpack.${env.env}.js`);

    return smp.wrap(webpackMerge.smart(commonConfig, envConfig));
}