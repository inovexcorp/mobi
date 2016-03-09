(function() {
    'use strict';

    angular
        .module('camelCase', [])
        .filter('camelCase', camelCase);

    function camelCase() {
        return function(value, type) {
            var result = '';

            if(value) {
                var capitalize = false,
                    whitespace = /\s/,
                    alphaNumeric = /[a-zA-Z0-9]/,
                    i = 1;

                if(type === 'class') {
                    result += value[0].toUpperCase();
                } else {
                    result += value[0].toLowerCase();
                }

                while(i < value.length) {
                    if(value[i].match(whitespace) !== null) {
                        capitalize = true;
                    } else if(value[i].match(alphaNumeric) === null) {
                        // do nothing with non letters
                    } else if(capitalize || (i === 0 && type === 'class')) {
                        result += value[i].toUpperCase();
                        capitalize = false;
                    } else {
                        result += value[i];
                    }
                    i++;
                }
            }
            return result;
        }
    }
})();