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

    dragFile.$inject = ['$timeout'];

    function dragFile($timeout) {
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
            controller: function() {
                var dvm = this;
                if (!_.isArray(dvm.files)) {
                    dvm.files = [];
                }
            },
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
            }
        }
    };
})();