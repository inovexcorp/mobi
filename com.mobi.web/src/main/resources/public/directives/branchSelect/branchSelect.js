/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
(function() {
    'use strict';

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
        .config(ignoreUnhandledRejectionsConfig)
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

        branchSelect.$inject = ['$timeout', 'utilService'];

        function branchSelect($timeout, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'directives/branchSelect/branchSelect.html',
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
})();
