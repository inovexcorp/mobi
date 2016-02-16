(function() {
    'use strict';

    angular
        .module('staticIri', [])
        .directive('staticIri', staticIri);

        function staticIri() {
            return {
                restrict: 'E',
                transclude: true,
                templateUrl: 'directives/staticIri/staticIri.html'
            }
        }
})();
