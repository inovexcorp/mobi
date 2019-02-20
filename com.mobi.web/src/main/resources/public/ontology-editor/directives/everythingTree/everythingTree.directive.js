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

    angular
        .module('everythingTree', [])
        .directive('everythingTree', everythingTree);

        everythingTree.$inject = ['ontologyManagerService', 'ontologyStateService', 'INDENT'];

        function everythingTree(ontologyManagerService, ontologyStateService, INDENT) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/everythingTree/everythingTree.directive.html',
                scope: {},
                bindToController: {
                    updateSearch: '<',
                    hierarchy: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.indent = INDENT;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.searchText = '';
                    dvm.filterText = '';

                    dvm.$onInit = function() {
                        update();
                    }
                    dvm.$onChanges = function() {
                        update();
                    }
                    dvm.onKeyup = function () {
                        dvm.filterText = dvm.searchText;
                        update();
                    }
                    dvm.searchFilter = function (node) {
                        delete node.underline;
                        delete node.parentNoMatch;
                        delete node.displayNode;
                        if (dvm.filterText) {
                            if (node['title']) {
                                node.set(dvm.os.listItem.ontologyRecord.recordId, true);
                                return true;
                            } else {
                                var entity = dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, node['@id']);
                                var searchValues = _.pick(entity, dvm.om.entityNameProps);
                                var match = false;
                                _.forEach(_.keys(searchValues), key => _.forEach(searchValues[key], value => {
                                    if (value['@value'].toLowerCase().includes(dvm.filterText.toLowerCase()))
                                        match = true;
                                }));
                                if (match) {
                                    var path = node.path[0];
                                    for (var i = 1; i < node.path.length - 1; i++) {
                                        var iri = node.path[i];
                                        path = path + '.' + iri;
                                        dvm.os.setOpened(path, true);

                                        var parentNode = _.find(dvm.hierarchy, {'@id': iri});
                                        parentNode.displayNode = true;
                                    }
                                    node.underline = true;
                                }
                                if (!match && node.hasChildren) {
                                    node.parentNoMatch = true;
                                    return true;
                                }
                                return match;
                            }
                        } else {
                            return true;
                        }
                    }
                    dvm.isShown = function(node) {
                        var displayNode = !_.has(node, '@id') || (_.has(node, 'get') && node.get(dvm.os.listItem.ontologyRecord.recordId)) || (!_.has(node, 'get') && node.indent > 0 && dvm.os.areParentsOpen(node)) || (node.indent === 0 && _.get(node, 'path', []).length === 2);
                        if (dvm.filterText && node['title']) {
                            var position = _.findIndex(dvm.filteredHierarchy, 'title');
                            if (position === dvm.filteredHierarchy.length - 1) {
                                node.set(dvm.os.listItem.ontologyRecord.recordId, false);
                                return false;
                            }
                        }
                        if (dvm.filterText && node.parentNoMatch) {
                            if (node.displayNode === undefined) {
                                return false;
                            } else {
                                return displayNode && node.displayNode;
                            }
                        }
                        return displayNode;
                    }

                    function update() {
                        dvm.updateSearch(dvm.filterText);
                        dvm.filteredHierarchy = _.filter(dvm.hierarchy, dvm.searchFilter);
                    }
                }
            }
        }
})();
