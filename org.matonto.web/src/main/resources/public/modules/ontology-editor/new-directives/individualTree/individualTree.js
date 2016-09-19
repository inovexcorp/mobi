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
        .module('individualTree', [])
        .directive('individualTree', individualTree);

        individualTree.$inject = ['ontologyManagerService', 'stateManagerService', 'settingsManagerService'];

        function individualTree(ontologyManagerService, stateManagerService, settingsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/new-directives/individualTree/individualTree.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var treeDisplay = settingsManagerService.getTreeDisplay();
                    dvm.om = ontologyManagerService;
                    dvm.sm = stateManagerService;

                    dvm.getTreeDisplay = function(entity) {
                        if (treeDisplay === 'pretty') {
                            return dvm.om.getEntityName(entity);
                        }
                        return _.get(entity, 'matonto.originalIRI', _.get(entity, 'matonto.anonymous', ''));
                    }
                }
            }
        }
})();
