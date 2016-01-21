(function() {
    'use strict';

    angular
        .module('removeNamespace', [])
        .filter('removeNamespace', removeNamespace);

    function removeNamespace() {
        return function (id) {
            var colon = id.lastIndexOf(':') + 1,
                result = id.substring(colon),
                hash = id.indexOf('#') + 1,
                slash = id.lastIndexOf('/') + 1;
            if(hash !== 0) {
                result = id.substring(hash);
            } else if(slash !== 0) {
                result = id.substring(slash);
            }
            return result;
        }
    }
})();