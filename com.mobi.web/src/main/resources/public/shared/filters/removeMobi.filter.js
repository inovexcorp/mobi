(function() {
    'use strict';

    angular
        .module('removeMobi', [])
        .filter('removeMobi', removeMobi);

    function removeMobi() {
        return function(obj) {
            return _.omit(angular.copy(obj), 'mobi');
        }
    }
})();