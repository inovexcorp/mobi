// Added to get around known race condition with earlier versions of Angular where the ng test wouldn't wait for the webpack build to complete before launching Karma
function WebpackCompilerEventsPlugin(options) {
    this.options = options;
}
  
WebpackCompilerEventsPlugin.prototype.apply = function(compiler) {
    compiler.hooks.done.tap('webpack-compiler-events-plugin', this.options.afterDone);
};
  
function waitWebpackFactory(config) {
    return new Promise(resolve => {
        let isFirstBuild = true;
        config.buildWebpack.webpackConfig.plugins.push(new WebpackCompilerEventsPlugin({
            afterDone: () => {
                if (isFirstBuild) {
                    console.log('First webpack build done');
                    isFirstBuild = false;
                    resolve();
                }
            }
        }));
    });
}
waitWebpackFactory.$inject = ['config'];
  
module.exports = {
    'framework:waitwebpack': ['factory', waitWebpackFactory]
};