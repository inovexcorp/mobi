(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name superClassSelect
         *
         * @description
         * The `superClassSelect` module only provides the `superClassSelect` directive which creates a collapsible
         * {@link classSelect.directive:classSelect} for super classes.
         */
        .module('superClassSelect', [])
        /**
         * @ngdoc directive
         * @name superClassSelect.directive:superClassSelect
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires util.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `classSelect` is a directive that creates a collapsible {@link classSelect.directive:classSelect} for
         * selecting the super classes of a class. When collapsed and then reopened, all previous values are cleared.
         * The directive is replaced by the contents of its template.
         *
         * @param {string[]} values The selected class IRIs for super classes
         */
        .directive('superClassSelect', superClassSelect);

        superClassSelect.$inject = ['ontologyStateService', 'utilService', 'ontologyUtilsManagerService'];

        function superClassSelect(ontologyStateService, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/superClassSelect/superClassSelect.directive.html',
                scope: {},
                bindToController: {
                    values: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.util = utilService;
                    dvm.isShown = false;
                    dvm.iris = _.map(dvm.values, '@id');

                    dvm.show = function() {
                        dvm.isShown = true;
                    }
                    dvm.hide = function() {
                        dvm.isShown = false;
                        dvm.iris = [];
                    }

                    $scope.$watch(() => dvm.iris.length, () => dvm.values = _.map(dvm.iris, iri => ({'@id': iri})));
                }]
            }
        }
})();