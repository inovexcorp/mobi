(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name projectTab
         *
         * @description
         * The `projectTab` module only provides the `projectTab` directive which creates a page for viewing
         * information about an ontology.
         */
        .module('projectTab', [])
        /**
         * @ngdoc directive
         * @name projectTab.directive:projectTab
         * @scope
         * @restrict E
         *
         * @description
         * `projectTab` is a directive that creates a page containing information about the current
         * {@link ontologyState.service:ontologyStateService selected ontology}. The display includes a
         * {@link selectedDetails.directive:selectedDetails}, an
         * {@link ontologyPropertiesBlock.directive:ontologyPropertiesBlock}, an
         * {@link importsBlock.directive:importsBlock}, and a {@link previewBlock.directive:previewBlock}. The
         * directive is replaced by the contents of its template.
         */
        .directive('projectTab', projectTab);

        function projectTab() {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                templateUrl: 'ontology-editor/directives/projectTab/projectTab.directive.html'
            }
        }
})();
