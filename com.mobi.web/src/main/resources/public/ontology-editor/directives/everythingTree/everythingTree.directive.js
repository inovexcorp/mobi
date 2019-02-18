(function() {
    'use strict';

    angular
        .module('everythingTree', [])
        .directive('everythingTree', everythingTree);

        everythingTree.$inject = ['ontologyManagerService', 'ontologyStateService', 'INDENT'];

        function everythingTree(ontologyManagerService, ontologyStateService, INDENT) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/everythingTree/everythingTree.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.indent = INDENT;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    
                    dvm.isShown = function(entity) {
                        return !_.has(entity, '@id') || (_.has(entity, 'get') && entity.get(dvm.os.listItem.ontologyRecord.recordId)) || (!_.has(entity, 'get') && entity.indent > 0 && dvm.os.areParentsOpen(entity)) || (entity.indent === 0 && _.get(entity, 'path', []).length === 2);
                    }
                }
            }
        }
})();
