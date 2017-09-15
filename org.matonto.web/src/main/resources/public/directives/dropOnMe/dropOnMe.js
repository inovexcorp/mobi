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
         * @name dropOnMe
         *
         * @description
         * The `dropOnMe` module provides the `dropOnMe` directive which provides a way to drop an element on this element.
         */
        .module('dropOnMe', [])
        /**
         * @ngdoc directive
         * @name dropOnMe.directive:dropOnMe
         * @restrict A
         *
         * @description
         * `dropOnMe` is a directive that allows users to drop on this element. This should be used in tandem with the `dragMe`
         * directive. The "dropId" attribute is a unique identifier to match up to a "dragId" which allows dropping the dragged
         * element on this element. The "onDrop" attribute is a function that will be executed with the "data" provided by the
         * dragged element.
         */
        .directive('dropOnMe', dropOnMe);
        
        dropOnMe.$inject = ['$timeout'];

        function dropOnMe($timeout) {
            return {
                restrict: 'A',
                scope: {
                    dropId: '<',
                    onDrop: '&'
                },
                link: function(scope, elem) {
                    elem.on('dragover', event => {
                        if (_.includes(event.dataTransfer.types, scope.dropId)) {
                            event.preventDefault();
                            elem.addClass('drop-hover');
                        }
                    });
                    elem.on('drop', event => {
                        var data = event.dataTransfer.getData(scope.dropId);
                        if (data) {
                            $timeout(function() {
                                event.preventDefault();
                                scope.onDrop({data: JSON.parse(data)});
                            });
                        }
                        elem.removeClass('drop-hover');
                    });
                    elem.on('dragleave', event => {
                        elem.removeClass('drop-hover');
                    });
                }
            }
        }
})();