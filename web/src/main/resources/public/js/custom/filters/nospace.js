/**
 * Description:
 *     removes white space from text. useful for html values that cannot have spaces
 * Usage:
 *   {{some_text | nospace}}
 */

(function() {
    'use strict';

    angular
        .module('app')
        .filter('nospace', nospace);

    function nospace() {
        return function (value) {
            return (!value) ? '' : value.replace(/ /g, '');
        }
    }
})();