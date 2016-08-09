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
         * @name passwordConfirmInput
         */
        .module('passwordConfirmInput', [])
        /**
         * @ngdoc directive
         * @name passwordConfirmInput.directive:passwordConfirmInput
         * @scope
         * @restrict E
         */
        .directive('passwordConfirmInput', passwordConfirmInput)
        /**
         * @ngdoc directive
         * @name passwordConfirmInput.directive:samePassword
         */
        .directive('samePassword', samePassword);

        function samePassword() {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function(scope, el, attrs, ctrl) {
                    ctrl.$validators.samePassword = function(modelValue, viewValue) {
                        var value = modelValue || viewValue;
                        if (ctrl.$isEmpty(value)) {
                            return true;
                        }
                        return value === scope.$eval(attrs.samePassword);
                    }
                }
            }
        }
        function passwordConfirmInput() {
            return {
                restrict: 'E',
                require: '^form',
                replace: true,
                controllerAs: 'dvm',
                scope: {
                    password: '=',
                    toConfirm: '=',
                    label: '=',
                    required: '=?'
                },
                link: function(scope, el, attrs, form) {
                    scope.form = form;
                    scope.required = angular.isDefined(scope.required) ? scope.required : false;
                },
                controller: function() {
                    var dvm = this;
                },
                templateUrl: 'directives/passwordConfirmInput/passwordConfirmInput.html'
            }
        }
})();