(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name columnSelect
         *
         * @description 
         * The `columnSelect` module only provides the `columnSelect` directive which creates
         * a ui-select with the passed column list and selected column.
         */
        .module('columnSelect', [])
        /**
         * @ngdoc directive
         * @name columnSelect.directive:columnSelect
         * @scope
         * @restrict E
         *
         * @description 
         * `columnSelect` is a directive which creates a ui-select with the passed column list and
         * selected column. The directive is replaced by the contents of its template.
         *
         * @param {string[]} columns an array of column headers
         * @param {string} selectedColumn the currently selected column header
         */
        .directive('columnSelect', columnSelect);

        function columnSelect() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    columns: '='
                },
                bindToController: {
                    selectedColumn: '='
                },
                controller: angular.noop,
                templateUrl: 'modules/mapper/directives/columnSelect/columnSelect.html'
            }
        }
})();
