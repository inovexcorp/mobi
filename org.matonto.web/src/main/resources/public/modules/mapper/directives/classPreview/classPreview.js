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
        .module('classPreview', ['ontologyManager'])
        .directive('classPreview', classPreview);

        classPreview.$inject = ['ontologyManagerService'];

        function classPreview(ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    classObj: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.createTitle = function() {
                        return ontologyManagerService.getEntityName(dvm.classObj);
                    }
                    dvm.createPropList = function() {
                        return _.map(_.get(dvm.classObj, 'matonto.properties'), function(prop) {
                            return ontologyManagerService.getEntityName(prop);
                        });
                    }
                },
                templateUrl: 'modules/mapper/directives/classPreview/classPreview.html'
            }
        }
})();
