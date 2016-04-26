(function() {
    'use strict';

    angular
        .module('stringSelect', ['customLabel', 'ontologyManager'])
        .directive('stringSelect', stringSelect);

        stringSelect.$inject = ['ontologyManagerService'];

        function stringSelect(ontologyManagerService) {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    changeEvent: '&',
                    displayText: '=',
                    excludeSelf: '=',
                    groupBy: '&',
                    onlyStrings: '=',
                    selectList: '=',
                    mutedText: '='
                },
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'dvm',
                controller: ['$filter', function($filter) {
                    var dvm = this;

                    dvm.getItemNamespace = function(item) {
                        return $filter('splitIRI')(item).begin;
                    }
                }],
                templateUrl: 'modules/ontology-editor/directives/stringSelect/stringSelect.html'
            }
        }
})();
