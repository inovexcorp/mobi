/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    fileChange.$inject = ['$parse'];

    function fileChange($parse) {
        return {
            restrict: 'A',
            link: function ($scope, element, attrs) {
                // Get the function provided in the file-change attribute.
                // Note the attribute has become an angular expression,
                // which is what we are parsing. The provided handler is 
                // wrapped up in an outer function (attrHandler) - we'll 
                // call the provided event handler inside the handler()
                // function below.
                var attrHandler = $parse(attrs['fileChange']);
        
                // This is a wrapper handler which will be attached to the
                // HTML change event.
                var handler = function (e) {
        
                    $scope.$apply(function () {
                        // Execute the provided handler in the directive's scope.
                        // The files variable will be available for consumption
                        // by the event handler.
                        attrHandler($scope, { $event: e, files: _.toArray(e.target.files) });
                    });
                };
        
                // Attach the handler to the HTML change event 
                element[0].addEventListener('change', handler, false);
            }
        };
    }

    angular.module('shared')
        .directive('fileChange', fileChange)
})();