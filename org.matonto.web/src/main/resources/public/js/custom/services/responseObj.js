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

        self.validate = function(response) {
            if(!Array.isArray(response) || !self.validateItem(response[0])) {
                return false;
            }
            return true;
        }

        self.stringify = function(response) {
            var arr = [];

            if(self.validate(response)) {
                var i = 0,
                    temp = angular.copy(response);

                while(i < temp.length) {
                    arr.push(temp[i].namespace + temp[i].localName);
                    i++;
                }
            }

            return arr;
        }
    }
})();