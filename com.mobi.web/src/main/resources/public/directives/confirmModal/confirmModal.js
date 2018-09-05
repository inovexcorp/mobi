/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
         * @name confirmModal
         *
         * @description
         * The `confirmModal` module only provides the `confirmModal` directive
         * which 
         */
        .module('confirmModal', [])
        /**
         * @ngdoc directive
         * @name  confirmModal.directive:confirmModal
         * @scope
         * @restrict E
         *
         * @description
         * `confirmModal` is a directive that
         */
        .directive('confirmModal', confirmModal);

        function confirmModal() {
            return {
                restrict: 'E',
                scope: {
                    resolve: '<',
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;

                    dvm.yes = function() {
                        Promise.resolve($scope.resolve.yes()).then(() => {
                            $scope.close();
                        });
                    }
                    dvm.no = function() {
                        Promise.resolve($scope.resolve.no()).then(() => $scope.dismiss());
                    }
                }],
                templateUrl: 'directives/confirmModal/confirmModal.html'
            }
        }
})();
