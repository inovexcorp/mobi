(function() {
    'use strict';

    angular
        .module('trusted', [])
        .filter('trusted', trusted);

    trusted.$inject = ['$sce'];

    function trusted($sce) {
        return function(text) {
            if(text) {
                return $sce.trustAsHtml(text);
            } else {
                return;
            }
        }
    }
})();