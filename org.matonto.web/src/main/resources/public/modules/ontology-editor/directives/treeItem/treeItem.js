(function() {
    'use strict';

    angular
        .module('treeItem', ['settingsManager', 'ontologyManager'])
        .directive('treeItem', treeItem);

        treeItem.$inject = ['$filter', 'settingsManagerService', 'ontologyManagerService', 'prefixes'];

        function treeItem($filter, settingsManagerService, ontologyManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    currentEntity: '=',
                    currentOntology: '=',
                    isActive: '=',
                    onClick: '&'
                },
                templateUrl: 'modules/ontology-editor/directives/treeItem/treeItem.html',
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var treeDisplay = settingsManagerService.getTreeDisplay();

                    dvm.getTreeDisplay = function(entity) {
                        var result = entity['@id'];
                        if(treeDisplay === 'pretty') {
                            result = ontologyManagerService.getEntityName(entity);
                        }
                        return result;
                    }
                }]
            }
        }
})();
