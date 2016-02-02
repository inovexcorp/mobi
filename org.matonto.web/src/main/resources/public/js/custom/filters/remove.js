(function() {
    'use strict';

    angular
        .module('remove', [])
        .filter('remove', remove);

    function remove() {
        return function(arr, string) {
            if(arr) {
                var temp = angular.copy(arr),
                    i = 0;

                while(i < temp.length) {
                    if(string === (temp[i].namespace + temp[i].localName)) {
                        temp.splice(i, 1);
                        return temp;
                    }
                    i++;
                }
            }
            return arr;
        }
    }
})();