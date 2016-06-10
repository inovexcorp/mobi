(function() {
    'use strict';

    angular
        .module('stringSelect', [])
        .directive('stringSelect', stringSelect);

        function stringSelect() {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    changeEvent: '&',
                    displayText: '=',
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
