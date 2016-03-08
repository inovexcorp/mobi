(function() {
    'use strict';

    angular
        .module('classEditor', [])
        .directive('classEditor', classEditor);

        function classEditor() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/classEditor/classEditor.html'
            }
        }
})();
