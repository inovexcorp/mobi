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
        .module('propSelect', ['ontologyManager'])
        /**
         * @ngdoc directive
         * @name propSelect.directive:propSelect
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         *
         * @description 
         * `propSelect` is a directive which creates a ui-select with the passed property 
         * list, a selected property object, and an optional function to be called when 
         * the selected property is changed. The directive is replaced by the contents of 
         * its template.
         *
         * @param {object[]} props an array of property objects from the {@link ontologyManager.service:ontologyMangerService ontologyMangerService}
         * @param {function} [onChange=undefined] an optional function to be called on change 
         * of the selected property
         * @param {object} selectedProp the currently selected property object
         * @param {string} selectedProp['@id'] the IRI of the property
         */
        .directive('propSelect', propSelect);

        propSelect.$inject = ['ontologyManagerService'];

        function propSelect(ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    props: '=',
                    onChange: '&'
                },
                bindToController: {
                    selectedProp: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                },
                templateUrl: 'modules/mapper/directives/propSelect/propSelect.html'
            }
        }
})();
