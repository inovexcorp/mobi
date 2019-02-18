(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name classMappingSelect
         *
         * @description
         * The `classMappingSelect` module only provides the `classMappingSelect` directive which creates
         * a `ui-select` with a list of ClassMappings.
         */
        .module('classMappingSelect', [])
        /**
         * @ngdoc directive
         * @name classMappingSelect.directive:classMappingSelect
         * @scope
         * @restrict E
         * @requires mappingManager.service:mappingManagerService
         * @requires mapperState.service:mapperStateService
         * @requires util.service:utilService
         *
         * @description
         * `classMappingSelect` is a directive that creates a div with `ui-select` containing all the ClassMappings
         * in the passed list. The model for the `ui-select` will be the id of the selected ClassMapping. The
         * directive is replaced by the contents of its template.
         *
         * @param {Object[]} classMappings A list of ClassMapping JSON-LD objects
         * @param {Function} onChange A method to be called when the selected ClassMapping changes
         * @param {string} bindModel The id of the selected ClassMapping
         */
        .directive('classMappingSelect', classMappingSelect);

        classMappingSelect.$inject = ['mappingManagerService', 'mapperStateService', 'utilService'];

        function classMappingSelect(mappingManagerService, mapperStateService, utilService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                	onChange: '&'
                },
                bindToController: {
                    bindModel: '=ngModel'
                },
                controller: function() {
                    var dvm = this;
                    dvm.mm = mappingManagerService;
                    dvm.state = mapperStateService;
                    dvm.util = utilService;

                    dvm.getTitle = function(classMapping) {
                        return dvm.util.getDctermsValue(classMapping, 'title');
                    }
                },
                templateUrl: 'mapper/directives/classMappingSelect/classMappingSelect.directive.html'
            }
        }
})();
