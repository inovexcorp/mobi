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
(function () {
    'use strict';

    angular
        .module('stepProgressBar', [])
        .directive('stepProgressBar', stepProgressBar);

    function stepProgressBar() {
        return {
            restrict: 'E',
            controllerAs: 'dvm',
            reaplce: true,
            scope: {
                stepNumber: '<',
                currentStep: '<'
            },
            controller: ['$scope', function($scope) {
                var dvm = this;

                dvm.getRange = function(num) {
                    return _.range(0, num);
                }
                dvm.getPercentage = function(totalNum, stepNum) {
                    return 100/(totalNum - 1) * stepNum;
                }
                dvm.calculateLeft = function(step) {
                    if (step === 0) {
                        return '0%';
                    } else if (step === $scope.stepNumber - 1) {
                        return 'auto';
                    } else {
                        return dvm.getPercentage($scope.stepNumber, step) + '%';
                    }
                }
                dvm.calculateRight = function(step) {
                    return (step === $scope.stepNumber - 1) ? '0%' : 'auto';
                }
                dvm.calculateTransform = function(step) {
                    return (step !== 0 && step !== $scope.stepNumber - 1) ? 'translate(-50%)' : 'none';
                }
            }],
            templateUrl: 'directives/stepProgressBar/stepProgressBar.html'
        };
    }
})();
