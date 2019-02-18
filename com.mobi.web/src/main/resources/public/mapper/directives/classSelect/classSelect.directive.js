(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name classSelect
         *
         * @description
         * The `classSelect` module only provides the `classSelect` directive which creates
         * a ui-select with the passed class list, a selected class, and an optional
         * function to be called when the selected class changes.
         */
        .module('classSelect', [])
        /**
         * @ngdoc directive
         * @name classSelect.directive:classSelect
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires $filter
         *
         * @description
         * `classSelect` is a directive which creates a ui-select with the passed class
         * list, a selected class object, and an optional function to be called when
         * the selected class is changed. The directive is replaced by the contents of
         * its template.
         *
         * @param {Object[]} classes an array of class objects from the
         * {@link mapperState.service:mapperStateService mapperStateService}
         * @param {Function} [onChange=undefined] an optional function to be called on change
         * of the selected class
         * @param {Object} selectedClass the currently selected class object
         * @param {string} selectedClass.ontologyid the id of the ontology that contains the class
         * @param {Object} selectedClass.classObj the JSON-LD class object
         */
        .directive('classSelect', classSelect);

        classSelect.$inject = ['$filter', 'ontologyManagerService'];

        function classSelect($filter, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    classes: '<',
                    isDisabledWhen: '<',
                    onChange: '&?'
                },
                bindToController: {
                    selectedClass: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;

                    dvm.getOntologyId = function(clazz) {
                        return clazz.ontologyId || $filter('splitIRI')(clazz.classObj['@id']).begin;
                    }
                },
                templateUrl: 'mapper/directives/classSelect/classSelect.directive.html'
            }
        }
})();
