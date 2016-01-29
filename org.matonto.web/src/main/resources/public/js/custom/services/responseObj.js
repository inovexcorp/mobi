(function() {
    'use strict';

    angular
        .module('responseObj', [])
        .service('responseObj', responseObj);

    function responseObj() {
        var self = this;

        self.stringify = function(response) {
            var i = 0,
                arr = [],
                temp = angular.copy(response);

            while(i < temp.length) {
                arr.push(temp[i].namespace + temp[i].localName);
                i++;
            }

            return arr;
        }
    }
})();