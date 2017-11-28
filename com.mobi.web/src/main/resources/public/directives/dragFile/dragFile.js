/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
        .module('dragFile', [])
        .directive('dragFile', dragFile);

    dragFile.$inject = ['$timeout', '$window'];

    function dragFile($timeout, $window) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'directives/dragFile/dragFile.html',
            scope: {
                onDrop: '&?'
            },
            bindToController: {
                files: '='
            },
            controllerAs: 'dvm',
            controller: ['$scope', function($scope) {
                var dvm = this;
                dvm.inputFiles = [];

                if (!_.isArray(dvm.files)) {
                    dvm.files = [];
                }

                $scope.$watch('dvm.inputFiles', (newValue, oldValue) => {
                    if (_.isArray(newValue) && newValue.length) {
                        dvm.files.push(...newValue);
                        if ($scope.onDrop) {
                            $scope.onDrop();
                        }
                    }
                });
            }],
            link: function(scope, elem, attrs, controller) {
                elem.on('dragenter', event => event.preventDefault());
                elem.on('dragover', event => {
                    event.preventDefault();
                    if (_.get(event.dataTransfer, 'files', []).length) {
                        elem.addClass('hover');
                    }
                });
                elem.on('drop', event => {
                    event.preventDefault();
                    controller.files.push(...event.dataTransfer.files);
                    elem.removeClass('hover');
                    if (scope.onDrop) {
                        scope.onDrop();
                    }
                    scope.$apply();
                });
                elem.on('dragleave', event => {
                    elem.removeClass('hover');
                });

                var windowElem = angular.element($window);
                windowElem.on('dragenter', event => event.preventDefault());
                windowElem.on('dragover', event => event.preventDefault());
                windowElem.on('drop', event => event.preventDefault());

                scope.$on('$destroy', () => {
                    var windowElem = angular.element($window);
                    windowElem.off('dragenter');
                    windowElem.off('dragover');
                    windowElem.off('drop');
                });
            }
        }
    };
})();