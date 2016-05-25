(function() {
    'use strict';

    angular
        .module('treeItem', ['settingsManager', 'ontologyManager'])
        .directive('treeItem', treeItem);

        treeItem.$inject = ['settingsManagerService', 'ontologyManagerService'];

        function treeItem(settingsManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    currentEntity: '=',
                    currentOntology: '=',
                    isActive: '=',
                    onClick: '&',
                    hasChildren: '='
                },
                bindToController: {
                    isOpened: '='
                },
                templateUrl: 'modules/ontology-editor/directives/treeItem/treeItem.html',
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

                    dvm.toggleOpen = function() {
                         dvm.isOpened = !dvm.isOpened;
                    }
                }
            }
        }
})();
