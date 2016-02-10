(function() {
    'use strict';

    angular
        .module('removeIriFromArray', ['responseObj'])
        .filter('removeIriFromArray', removeIriFromArray);

    removeIriFromArray.$inject = ['responseObj'];

    function removeIriFromArray(responseObj) {
        return function(arr, string) {
            var temp = [];

            if(Array.isArray(arr)) {
                var i = 0;

                while(i < arr.length) {
                    if(string !== responseObj.getItemIri(arr[i])) {
                        temp.push(arr[i]);
                    }
                    i++;
                }
            }

            return temp;
        }
    }
})();