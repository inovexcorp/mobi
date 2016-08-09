/*-
 * #%L
 * org.matonto.web
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
         * @name checkbox
         */
        .module('checkbox', [])
        /**
         * @ngdoc directive
         * @name checkbox.directive:checkbox
         * @scope
         * @restrict E
         * @requires $timeout
         */
        .directive('checkbox', checkbox);

        checkbox.$inject = ['$timeout'];

        function checkbox($timeout) {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    bindModel: '=ngModel',
                    changeEvent: '&',
                    displayText: '=',
                    isDisabledWhen: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;

                    dvm.onChange = function() {
                        $timeout(function() {
                            $scope.changeEvent();                            
                        });
                    }
                }],
                templateUrl: 'directives/checkbox/checkbox.html'
            }
        }
})();