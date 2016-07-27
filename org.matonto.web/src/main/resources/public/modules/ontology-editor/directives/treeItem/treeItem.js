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
        .module('treeItem', [])
        .directive('treeItem', treeItem);

        treeItem.$inject = ['settingsManagerService', 'ontologyManagerService'];

        function treeItem(settingsManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    currentEntity: '=',
                    currentOntology: '=',
                    isActive: '=',
                    onClick: '&',
                    hasChildren: '='
                },
                bindToController: {
                    isOpened: '='
                },
                templateUrl: 'modules/ontology-editor/directives/treeItem/treeItem.html',
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var treeDisplay = settingsManagerService.getTreeDisplay();

                    dvm.getTreeDisplay = function(entity) {
                        var result = _.get(entity, '@id', _.get(entity, 'matonto.id', ''));
                        if(treeDisplay === 'pretty') {
                            result = ontologyManagerService.getEntityName(entity);
                        }
                        return result;
                    }

                    dvm.toggleOpen = function() {
                         dvm.isOpened = !dvm.isOpened;
                    }
                }
            }
        }
})();
