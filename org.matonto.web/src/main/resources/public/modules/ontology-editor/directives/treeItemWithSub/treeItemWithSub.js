(function() {
    'use strict';

    angular
        .module('treeItemWithSub', ['settingsManager', 'ontologyManager'])
        .directive('treeItemWithSub', treeItemWithSub);

        treeItemWithSub.$inject = ['settingsManagerService', 'ontologyManagerService'];

        function treeItemWithSub(settingsManagerService, ontologyManagerService) {
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
                controller: function() {
                    var dvm = this;
                    var treeDisplay = settingsManagerService.getTreeDisplay();

                    dvm.getTreeDisplay = function(entity) {
                        var result = entity['@id'];
                        if(treeDisplay === 'pretty') {
                            result = ontologyManagerService.getEntityName(entity);
                        }
                        return result;
                    }
                }
            }
        }
})();
