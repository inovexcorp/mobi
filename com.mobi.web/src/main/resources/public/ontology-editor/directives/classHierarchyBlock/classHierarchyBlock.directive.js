(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name classHierarchyBlock
         *
         * @description
         * The `classHierarchyBlock` module only provides the `classHierarchyBlock` directive which creates a
         * section for displaying the classes in an ontology.
         */
        .module('classHierarchyBlock', [])
        /**
         * @ngdoc directive
         * @name classHierarchyBlock.directive:classHierarchyBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `classHierarchyBlock` is a directive that creates a section that displays a
         * {@link hierarchyTree.directive:hierarchyTree} of the clases in the current
         * {@link ontologyState.service:ontologyStateService selected ontology}. The directive is replaced by the
         * contents of its template.
         */
        .directive('classHierarchyBlock', classHierarchyBlock);

        classHierarchyBlock.$inject = ['ontologyStateService'];

        function classHierarchyBlock(ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/classHierarchyBlock/classHierarchyBlock.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;

                    dvm.updateSearch = function(value) {
                        dvm.os.listItem.editorTabStates.classes.searchText = value;
                    }
                }
            }
        }
})();
