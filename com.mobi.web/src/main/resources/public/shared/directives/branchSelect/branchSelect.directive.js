(function() {
    'use strict';

    branchSelect.$inject = ['$timeout', 'utilService'];

    function branchSelect($timeout, utilService) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'shared/directives/branchSelect/branchSelect.directive.html',
            scope: {
                required: '<',
                branches: '<',
                isDisabledWhen: '<',
                changeEvent: '&',
            },
            bindToController: {
                bindModel: '=ngModel'
            },
            controllerAs: 'dvm',
            controller: ['$scope', function($scope) {
                var dvm = this;
                dvm.util = utilService;

                dvm.onChange = function() {
                    $timeout(function() {
                        $scope.changeEvent();
                    });
                }
            }]
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name branchSelect
         *
         * @description
         * The `branchSelect` module only provides the `branchSelect` directive
         * which creates a ui-select to select a branch from within the provided list of branches.
         */
        .module('branchSelect', [])
        /**
         * @ngdoc directive
         * @name branchSelect.directive:branchSelect
         * @scope
         * @restrict E
         * @requires util.service:utilService
         *
         * @description
         * `branchSelect` is a directive which creates a Bootstrap form-group div containing a ui-select
         * to select a Branch JSON-LD object from within the provided array of Branch JSON-LD objects. The
         * select can be disabled and set to be required using parameters. Can also provide a function to call
         * when the value of the select changes. The directive is replaced by the contents of its template.
         *
         * @param {boolean} required An expression that determines whether the select is required
         * @param {boolean} isDisabledWhen An expression that determines whether the select is disabled
         * @param {Object[]} branches An array of JSON-LD objects representing Branches
         * @param {Function} changeEvent A function to call when the value of the select is changed
         * @param {Object} bindModel The variable to bind the value of the select field to
         */
        .directive('branchSelect', branchSelect);
})();
