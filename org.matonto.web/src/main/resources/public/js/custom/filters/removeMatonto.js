/*
 *  TODO: For testing purposes only. Remove for release versions.
 */
(function() {
    'use strict';

    angular
        .module('removeMatonto', [])
        .filter('removeMatonto', removeMatonto);

    function removeMatonto() {
        return function(obj) {
            if(obj) {
                var temp = angular.copy(obj);
                delete temp.matonto;
                return temp;
            } else {
                return;
            }
        }
    }
})();