(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name ontologyClassSelect
         *
         * @description
         * The `ontologyClassSelect` module only provides the `ontologyClassSelect` directive which creates a `ui-select` of all the
         * classes in the imports closure of an ontology.
         */
        .module('ontologyClassSelect', [])
        /**
         * @ngdoc directive
         * @name ontologyClassSelect.directive:ontologyClassSelect
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires util.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `ontologyClassSelect` is a directive that creates a Bootstrap `form-group` with a `ui-select` of the IRIs of
         * all the classes in the current {@link ontologyState.service:ontologyStateService selected ontology} and its
         * imports. The directive is replaced by the contents of its template.
         *
         * @param {string[]} values The selected IRIs from the `ui-select`
         * @param {Function} lockChoice An optional expression to determine whether a selected class should be locked
         */
        .directive('ontologyClassSelect', ontologyClassSelect);

        ontologyClassSelect.$inject = ['ontologyStateService', 'utilService', 'ontologyUtilsManagerService'];

        function ontologyClassSelect(ontologyStateService, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/ontologyClassSelect/ontologyClassSelect.directive.html',
                scope: {},
                bindToController: {
                    values: '=',
                    lockChoice: '&'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.util = utilService;
                    dvm.array = [];

                    dvm.getValues = function(searchText) {
                        dvm.array =  dvm.ontoUtils.getSelectList(_.keys(os.listItem.classes.iris), searchText, dvm.ontoUtils.getDropDownText);
                    }
                }
            }
        }
})();