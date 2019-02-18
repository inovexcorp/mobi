(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name propSelect
         *
         * @description
         * The `propSelect` module only provides the `propSelect` directive which creates
         * a ui-select with the passed property list, a selected property, and an optional
         * function to be called when the selected property changes.
         */
        .module('propSelect', [])
        /**
         * @ngdoc directive
         * @name propSelect.directive:propSelect
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires $filter
         *
         * @description
         * `propSelect` is a directive which creates a ui-select with the passed property
         * list, a selected property object, and an optional function to be called when
         * the selected property is changed. The directive is replaced by the contents of
         * its template.
         *
         * @param {object[]} props an array of property objects from the
         * {@link ontologyManager.service:ontologyManagerService ontologyManagerService}
         * @param {boolean} isDisabledWhen whether or not the select should be disabled
         * @param {function} [onChange=undefined] an optional function to be called on change
         * of the selected property
         * @param {object} selectedProp the currently selected property object
         */
        .directive('propSelect', propSelect);

        propSelect.$inject = ['$filter', 'ontologyManagerService'];

        function propSelect($filter, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    props: '<',
                    isDisabledWhen: '<',
                    onChange: '&?'
                },
                bindToController: {
                    selectedProp: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;

                    dvm.getOntologyId = function(prop) {
                        return prop.ontologyId || $filter('splitIRI')(prop.propObj['@id']).begin;
                    }
                },
                templateUrl: 'mapper/directives/propSelect/propSelect.directive.html'
            }
        }
})();
