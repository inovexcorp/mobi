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
        /**
         * @ngdoc overview
         * @name dragFile
         *
         * @description
         * The `dragFile` module only provides the `dragFile` directive which creates the draggable
         * file section.
         */
        .module('dragFile', [])
        /**
         * @ngdoc directive
         * @name dragFile.directive:dragFile
         * @scope
         * @restrict E
         * @requires $window
         *
         * @description
         * HTML contents in the drag file which provides an area to drop or browse for files.
         *
         * @param {Function} onDrop the function to execute on file drop
         * @param {Object[]} files the list of files that were dropped
         */
        .directive('dragFile', dragFile);

    dragFile.$inject = ['$window'];

    function dragFile($window) {
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
                    if (_.get(event.dataTransfer, 'items', []).length) {
                        elem.addClass('hover');
                    } else {
                        event.preventDefault();
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
                elem.on('dragleave', event => elem.removeClass('hover'));

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