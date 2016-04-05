(function() {
    'use strict';

    angular
        .module('treeItemWithSub', ['settingsManager'])
        .directive('treeItemWithSub', treeItemWithSub);

        treeItemWithSub.$inject = ['$filter', 'settingsManagerService', 'ontologyManagerService', 'prefixes'];

        function treeItemWithSub($filter, settingsManagerService, ontologyManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    currentEntity: '=',
                    currentOntology: '=',
                    isActive: '=',
                    isOpened: '=',
                    onClick: '&'
                },
                templateUrl: 'modules/ontology-editor/directives/treeItemWithSub/treeItemWithSub.html',
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
