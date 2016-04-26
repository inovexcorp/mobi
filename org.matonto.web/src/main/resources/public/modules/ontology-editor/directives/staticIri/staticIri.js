(function() {
    'use strict';

    angular
        .module('staticIri', [])
        .directive('staticIri', staticIri);

        function staticIri() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/staticIri/staticIri.html',
                link: function(scope, element, attrs) {
                    scope.displayType = attrs.displayType;
                }
            }
        }
})();
