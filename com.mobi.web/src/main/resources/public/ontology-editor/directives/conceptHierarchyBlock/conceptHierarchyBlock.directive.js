(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name conceptHierarchyBlock
         *
         * @description
         * The `conceptHierarchyBlock` module only provides the `conceptHierarchyBlock` directive which creates a
         * section for displaying the concepts in an ontology/vocabulary.
         */
        .module('conceptHierarchyBlock', [])
        /**
         * @ngdoc directive
         * @name conceptHierarchyBlock.directive:conceptHierarchyBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `conceptHierarchyBlock` is a directive that creates a section that displays a
         * {@link hierarchyTree.directive:hierarchyTree} of the concepts in the current
         * {@link ontologyState.service:ontologyStateService selected ontology/vocabulary}. The directive is replaced
         * by the contents of its template.
         */
        .directive('conceptHierarchyBlock', conceptHierarchyBlock);

        conceptHierarchyBlock.$inject = ['ontologyStateService'];

        function conceptHierarchyBlock(ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/conceptHierarchyBlock/conceptHierarchyBlock.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;

                    dvm.updateSearch = function(value) {
                        dvm.os.listItem.editorTabStates.concepts.searchText = value;
                    }
                }
            }
        }
})();
