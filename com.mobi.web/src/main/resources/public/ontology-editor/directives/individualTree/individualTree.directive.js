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
        /**
         * @ngdoc overview
         * @name individualTree
         *
         * @description
         * The `individualTree` module only provides the `individualTree` directive which creates a hierarchy of individuals
         * and the classes they are related to.
         */
        .module('individualTree', [])
        /**
         * @ngdoc directive
         * @name individualTree.directive:individualTree
         * @scope
         * @restrict E
         * @requires shared.service:ontologyManagerService
         * @requires shared.service:ontologyStateService
         * @requires shared.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `individualTree` is a directive that creates a `div` containing a {@link shared.component:searchBar}
         * and hierarchy of {@link treeItem.directive:treeItem}s of individuals. When search text is provided, the
         * hierarchy filters what is shown based on value matches with predicates in the
         * {@link shared.service:ontologyManagerService entityNameProps}.
         *
         * @param {Object[]} hierarchy An array which represents a flattened individual hierarchy
         * @param {Function} updateSearch A function to update the state variable used to track the search filter text
         */
        .directive('individualTree', individualTree);

        individualTree.$inject = ['ontologyManagerService', 'ontologyStateService', 'utilService', 'ontologyUtilsManagerService', 'INDENT'];

        function individualTree(ontologyManagerService, ontologyStateService, utilService, ontologyUtilsManagerService, INDENT) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/individualTree/individualTree.directive.html',
                scope: {},
                bindToController: {
                    updateSearch: '&',
                    hierarchy: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.indent = INDENT;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.util = utilService;
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
                            if (node.isClass) {
                                node.parentNoMatch = true;
                                return true;
                            } else {
                                var entity = dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, node.entityIRI);
                                var searchValues = _.pick(entity, dvm.om.entityNameProps);
                                var match = false;
                                _.some(_.keys(searchValues), key => _.some(searchValues[key], value => {
                                    if (value['@value'].toLowerCase().includes(dvm.filterText.toLowerCase()))
                                        match = true;
                                }));
                                if (dvm.util.getBeautifulIRI(entity['@id']).toLowerCase().includes(dvm.filterText.toLowerCase())) {
                                    match = true;
                                }
                                if (match) {
                                    var path = node.path[0];
                                    for (var i = 1; i < node.path.length - 1; i++) {
                                        var iri = node.path[i];
                                        path = path + '.' + iri;
                                        dvm.os.setOpened(path, true);

                                        var parentNode = _.find(dvm.hierarchy, {'entityIRI': iri});
                                        parentNode.displayNode = true;
                                    }
                                    node.underline = true;
                                }
                                return match;
                            }
                        } else {
                            return true;
                        }
                    }
                    dvm.isShown = function(node) {
                        var displayNode = (node.indent > 0 && dvm.os.areParentsOpen(node, dvm.os.getOpened)) || (node.indent === 0 && _.get(node, 'path', []).length === 2);
                        if (dvm.filterText && node.parentNoMatch) {
                            if (node.displayNode === undefined) {
                                return false;
                            } else {
                                return displayNode && node.displayNode;
                            }
                        }
                        return displayNode;
                    }
                    dvm.isImported = function(entityIRI) {
                        return !_.has(dvm.os.listItem.index, entityIRI);
                    }

                    function update() {
                        dvm.updateSearch({value: dvm.filterText});
                        dvm.filteredHierarchy = _.filter(dvm.hierarchy, dvm.searchFilter);
                    }
                }
            }
        }
})();