(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name superPropertySelect
         *
         * @description
         * The `superPropertySelect` module only provides the `superPropertySelect` directive which creates
         * the super property select.
         */
        .module('superPropertySelect', [])
        /**
         * @ngdoc directive
         * @name superPropertySelect.directive:superPropertySelect
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires util.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * HTML contents in the super property select which provides a link to show a dropdown select of
         * all available properties IRIs in the subobject idetified by the provided key.
         */
        .directive('superPropertySelect', superPropertySelect);

        superPropertySelect.$inject = ['ontologyStateService', 'utilService', 'ontologyUtilsManagerService'];

        function superPropertySelect(ontologyStateService, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/superPropertySelect/superPropertySelect.directive.html',
                scope: {},
                bindToController: {
                    key: '<',
                    values: '='
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.util = utilService;
                    dvm.isShown = false;
                    dvm.array = [];

                    dvm.show = function() {
                        dvm.isShown = true;
                    }
                    dvm.hide = function() {
                        dvm.isShown = false;
                        dvm.values = [];
                    }
                    dvm.getValues = function(searchText) {
                        dvm.array =  dvm.ontoUtils.getSelectList(_.keys(os.listItem[dvm.key].iris), searchText, dvm.ontoUtils.getDropDownText);
                    }
                }
            }
        }
})();