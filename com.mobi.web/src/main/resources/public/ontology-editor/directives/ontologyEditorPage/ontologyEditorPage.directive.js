(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name ontologyEditorPage
         *
         * @description
         * The `ontologyEditorPage` module provides the `ontologyEditorPage` directive which creates a `div`
         * with the main components of the Ontology Editor.
         */
        .module('ontologyEditorPage', [])
        /**
         * @ngdoc directive
         * @name ontologyEditorPage.directive:ontologyEditorPage
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `ontologyEditorPage` is a directive that creates a `div` containing the main components of the Ontology
         * Editor. These components are {@link ontologySidebar.directive:ontologySidebar},
         * {@link ontologyTab.directive:ontologyTab} with the
         * {@link ontologyState.service:ontologyStateService currently selected open ontology}, and
         * {@link openOntologyTab.directive:openOntologyTab}. The directive is replaced by the contents of
         * its template.
         */
        .directive('ontologyEditorPage', ontologyEditorPage);

        ontologyEditorPage.$inject = ['ontologyStateService'];

        function ontologyEditorPage(ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/ontologyEditorPage/ontologyEditorPage.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.os = ontologyStateService;

                    dvm.isOpenTab = function() {
                        return _.isEmpty(dvm.os.listItem);
                    }
                }]
            }
        }
})();
