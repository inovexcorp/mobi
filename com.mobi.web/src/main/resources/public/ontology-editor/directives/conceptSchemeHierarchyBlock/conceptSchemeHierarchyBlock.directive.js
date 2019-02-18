(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name conceptSchemeHierarchyBlock
         *
         * @description
         * The `conceptSchemeHierarchyBlock` module only provides the `conceptSchemeHierarchyBlock` directive which
         * creates a section for displaying the concepts and concept schemes in an ontology/vocabulary.
         */
        .module('conceptSchemeHierarchyBlock', [])
        /**
         * @ngdoc directive
         * @name conceptSchemeHierarchyBlock.directive:conceptSchemeHierarchyBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `conceptSchemeHierarchyBlock` is a directive that creates a section that displays a
         * {@link hierarchyTree.directive:hierarchyTree} of the concept schemes and concepts in the current
         * {@link ontologyState.service:ontologyStateService selected ontology/vocabulary}. The directive is replaced
         * by the contents of its template.
         */
        .directive('conceptSchemeHierarchyBlock', conceptSchemeHierarchyBlock);

        conceptSchemeHierarchyBlock.$inject = ['ontologyStateService'];

        function conceptSchemeHierarchyBlock(ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/conceptSchemeHierarchyBlock/conceptSchemeHierarchyBlock.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;

                    dvm.updateSearch = function(value) {
                        dvm.os.listItem.editorTabStates.schemes.searchText = value;
                    }
                }
            }
        }
})();
