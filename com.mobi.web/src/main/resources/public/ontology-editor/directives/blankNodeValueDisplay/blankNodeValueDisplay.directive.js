(function() {
    'use strict';

    angular
        .module('blankNodeValueDisplay', [])
        .directive('blankNodeValueDisplay', blankNodeValueDisplay);

        blankNodeValueDisplay.$inject = ['ontologyUtilsManagerService'];

        function blankNodeValueDisplay(ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/blankNodeValueDisplay/blankNodeValueDisplay.directive.html',
                scope: {
                    nodeId: '<'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.editorOptions = {
                        mode: 'text/omn',
                        indentUnit: 4,
                        lineWrapping: true,
                        readOnly: true,
                        cursorBlinkRate: -1,
                        height: 'dynamic',
                        scrollbarStyle: 'null',
                        viewportMargin: Infinity
                    };
                    dvm.value = '';
                    $scope.$watch('nodeId', newValue => {
                        dvm.value = dvm.ontoUtils.getBlankNodeValue(newValue);
                    });
                }]
            }
        }
})();
