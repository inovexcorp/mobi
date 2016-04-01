(function() {
    'use strict';

    angular
        .module('beautify', [])
        .filter('beautify', beautify);

    function beautify() {
        return function(value) {
            var result = '';

            if(value && typeof value !== 'object') {
                var reg = /[A-Z]/,
                    i = 1;
                result += value[0].toUpperCase();

                while(i < value.length) {
                    if(value[i].match(reg) !== null) {
                        result += ' ';
                    }
                    result += value[i];
                    i++;
                }
            }
            return result;
        }
    }
})();