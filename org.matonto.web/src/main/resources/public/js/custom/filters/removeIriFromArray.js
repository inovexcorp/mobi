(function() {
    'use strict';

    angular
        .module('removeIriFromArray', [])
        .filter('removeIriFromArray', removeIriFromArray);

    function removeIriFromArray() {
        return function(arr, string) {
            var temp = [],
                i = 0;

            while(i < arr.length) {
                if(string !== (arr[i].namespace + arr[i].localName)) {
                    temp.push(arr[i]);
                }
                i++;
            }

            return temp;
        }
    }
})();