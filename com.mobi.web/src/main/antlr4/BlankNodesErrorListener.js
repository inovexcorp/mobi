var ErrorListener = require('antlr4/error/ErrorListener').ErrorListener;

function BlankNodesErrorListener(resultObj) {
    ErrorListener.call(this);
    this.resultObj = resultObj;
    return this;
}

BlankNodesErrorListener.prototype = Object.create(ErrorListener.prototype);
BlankNodesErrorListener.prototype.constructor = BlankNodesErrorListener;

BlankNodesErrorListener.prototype.syntaxError = function(recognizer, offendingSymbol, line, column, msg, e) {
    this.resultObj.errorMessage = msg.charAt(0).toUpperCase() + msg.slice(1);
    this.resultObj.jsonld = undefined;
};

exports.BlankNodesErrorListener = BlankNodesErrorListener;