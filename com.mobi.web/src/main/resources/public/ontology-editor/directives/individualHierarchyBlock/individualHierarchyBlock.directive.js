(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name individualHierarchyBlock
         *
         * @description
         * The `individualHierarchyBlock` module only provides the `individualHierarchyBlock` directive which creates a
         * section for displaying the individuals in an ontology.
         */
        .module('individualHierarchyBlock', [])
        /**
         * @ngdoc directive
         * @name individualHierarchyBlock.directive:individualHierarchyBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `individualHierarchyBlock` is a directive that creates a section that displays a
         * {@link hierarchyTree.directive:hierarchyTree} of the individuals in the current
         * {@link ontologyState.service:ontologyStateService selected ontology} underneath their class types. The
         * directive is replaced by the contents of its template.
         */
        .directive('individualHierarchyBlock', individualHierarchyBlock);

        individualHierarchyBlock.$inject = ['ontologyStateService'];

        function individualHierarchyBlock(ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/individualHierarchyBlock/individualHierarchyBlock.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                }
            }
        }
})();
