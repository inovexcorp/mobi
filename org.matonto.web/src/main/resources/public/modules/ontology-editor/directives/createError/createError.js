(function() {
    'use strict';

    angular
        .module('createError', [])
        .directive('createError', createError);

        function createError() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createError/createError.html'
            }
        }
})();
