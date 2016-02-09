(function() {
    'use strict';

    angular
        .module('responseObj', [])
        .service('responseObj', responseObj);

    function responseObj() {
        var self = this;

        self.validateItem = function(item) {
            return item.hasOwnProperty('namespace') && item.hasOwnProperty('localName');
        }

        self.stringify = function(response) {
            var arr = [];

            if(Array.isArray(response)) {
                var item,
                    i = 0,
                    temp = angular.copy(response);

                while(i < temp.length) {
                    item = temp[i];
                    if(self.validateItem(item)) {
                        arr.push(item.namespace + item.localName);
                    }
                    i++;
                }
            }

            return arr;
        }
    }
})();