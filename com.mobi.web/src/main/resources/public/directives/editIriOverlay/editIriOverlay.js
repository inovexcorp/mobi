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
        .module('editIriOverlay', [])
        .directive('editIriOverlay', editIriOverlay);

        editIriOverlay.$inject = ['REGEX'];

        function editIriOverlay(REGEX) {
            return {
                restrict: 'E',
                templateUrl: 'directives/editIriOverlay/editIriOverlay.html',
                scope: {
                    resolve: '<',
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.namespacePattern = REGEX.IRI;
                    dvm.localNamePattern = REGEX.LOCALNAME;

                    dvm.iriBegin = $scope.resolve.iriBegin;
                    dvm.iriThen = $scope.resolve.iriThen;
                    dvm.iriEnd = $scope.resolve.iriEnd;

                    dvm.submit = function() {
                        $scope.close({$value: {iriBegin: dvm.iriBegin, iriThen: dvm.iriThen, iriEnd: dvm.iriEnd}})
                    }
                    dvm.resetVariables = function() {
                        dvm.iriBegin = $scope.resolve.iriBegin;
                        dvm.iriThen = $scope.resolve.iriThen;
                        dvm.iriEnd = $scope.resolve.iriEnd;
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();
