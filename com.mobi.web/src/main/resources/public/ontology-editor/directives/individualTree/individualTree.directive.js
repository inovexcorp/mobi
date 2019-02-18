(function() {
    'use strict';

    angular
        .module('individualTree', [])
        .directive('individualTree', individualTree);

        individualTree.$inject = ['ontologyManagerService', 'ontologyStateService', 'utilService', 'ontologyUtilsManagerService', 'INDENT'];

        function individualTree(ontologyManagerService, ontologyStateService, utilService, ontologyUtilsManagerService, INDENT) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/individualTree/individualTree.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.indent = INDENT;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.util = utilService;

                    dvm.isShown = function(node) {
                        return (node.indent > 0 && dvm.os.areParentsOpen(node, dvm.os.getOpened)) || (node.indent === 0 && _.get(node, 'path', []).length === 2);
                    }

                    dvm.isImported = function(entityIRI) {
                        return !_.has(dvm.os.listItem.index, entityIRI);
                    }
                }
            }
        }
})();