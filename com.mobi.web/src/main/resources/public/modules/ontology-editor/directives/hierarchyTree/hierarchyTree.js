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
(function() {
    'use strict';

    angular
        .module('hierarchyTree', [])
        .directive('hierarchyTree', hierarchyTree);

        hierarchyTree.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'prefixes', 'INDENT'];

        function hierarchyTree(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, prefixes, INDENT) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/hierarchyTree/hierarchyTree.html',
                scope: {},
                bindToController: {
                    hierarchy: '<',
                    updateSearch: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.indent = INDENT;
                    dvm.os = ontologyStateService;
                    dvm.ou = ontologyUtilsManagerService;
                    dvm.searchText = '';
                    dvm.filterText = '';
                    var om = ontologyManagerService;

                    dvm.isShown = function(node) {
                        return (node.indent > 0 && dvm.os.areParentsOpen(node)) || (node.indent === 0 && _.get(node, 'path', []).length === 2);
                    }
                    dvm.searchFilter = function(node) {
                        if (dvm.filterText && dvm.filterText !== '') {
                            var entity = dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, node.entityIRI);
                            var searchValues = _.pick(entity, om.entityNameProps);
                            var match = false;
                            _.forEach(_.keys(searchValues), key => _.forEach(searchValues[key], value => {
                                if (value['@value'].toLowerCase().includes(dvm.filterText.toLowerCase()))
                                    match = true;
                            }));
                            if (match) {
                                var path = node.path[0];
                                for (var i = 1; i < node.path.length; i++) {
                                    path = path + '.' + node.path[i];
                                    dvm.os.setOpened(path, true);
                                }
                            }
                            return match;
                        } else {
                            return true;
                        }
                    }

                    dvm.onKeyup = function() {
                        dvm.filterText = dvm.searchText;
                        dvm.updateSearch(dvm.filterText);
                    }
                }
            }
        }
})();
