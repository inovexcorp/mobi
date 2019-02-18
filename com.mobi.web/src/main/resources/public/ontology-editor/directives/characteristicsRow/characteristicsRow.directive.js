(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name characteristicsRow
         *
         * @description
         * The `characteristicsRow` module only provides the `characteristicsRow` directive which creates a
         * Bootstrap `.row` for displaying the {@link characteristicsBlock.directive:characteristicsBlock}.
         */
        .module('characteristicsRow', [])
        /**
         * @ngdoc directive
         * @name characteristicsRow.directive:characteristicsRow
         * @scope
         * @restrict E
         * @requires prefixes.service:prefixes
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `characteristicsRow` is a directive that creates a Bootstrap `.row` that displays the
         * {@link characteristicsBlock.directive:characteristicsBlock} depending on whether the
         * {@link ontologyState.service:ontologyStateService selected entity} is a object or data property.
         * The directive is replaced by the contents of its template.
         */
        .directive('characteristicsRow', characteristicsRow);

        characteristicsRow.$inject = ['ontologyManagerService', 'ontologyStateService'];

        function characteristicsRow(ontologyManagerService, ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/characteristicsRow/characteristicsRow.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                }
            }
        }
})();
