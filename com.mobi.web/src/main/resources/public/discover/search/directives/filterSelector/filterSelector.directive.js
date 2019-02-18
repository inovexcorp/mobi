(function() {
    'use strict';
    
    angular
        /**
         * @ngdoc overview
         * @name filterSelector
         *
         * @description
         * The `filterSelector` module only provides the `filterSelector` directive which creates
         * the filter selector.
         */
        .module('filterSelector', [])
        /**
         * @ngdoc directive
         * @name filterSelector.directive:filterSelector
         * @scope
         * @restrict E
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * HTML contents for the filter selector which provides the users with the options to select filter options
         * appropriate for the selected range.
         */
        .directive('filterSelector', filterSelector);
        
        filterSelector.$inject = ['utilService', 'prefixes'];
        
        function filterSelector(utilService, prefixes) {
            return {
                restrict: 'E',
                templateUrl: 'discover/search/directives/filterSelector/filterSelector.directive.html',
                replace: true,
                require: '^^propertyFilterOverlay',
                scope: {},
                bindToController: {
                    begin: '=',
                    boolean: '=',
                    end: '=',
                    filterType: '=',
                    range: '<',
                    regex: '=',
                    value: '='
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var needsOneInput = ['Contains', 'Exact', 'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to'];
                    dvm.util = utilService;
                    dvm.types = {
                        'datetime-local': ['Exact', 'Existence', 'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to', 'Range'],
                        number: ['Exact', 'Existence', 'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to', 'Range'],
                        text: ['Contains', 'Exact', 'Existence', 'Regex']
                    };

                    dvm.$onInit = function() {
                        dvm.type = dvm.util.getInputType(dvm.range);
                        dvm.pattern = dvm.util.getPattern(dvm.range);
                    }
                    dvm.needsOneInput = function() {
                        return _.includes(needsOneInput, dvm.filterType);
                    }
                    
                    dvm.isBoolean = function() {
                        return dvm.range === prefixes.xsd + 'boolean';
                    }

                    if (dvm.isBoolean()) {
                        dvm.filterType = 'Boolean';
                    } else {
                        dvm.filterType = undefined;
                    }
                }
            }
        }
})();
