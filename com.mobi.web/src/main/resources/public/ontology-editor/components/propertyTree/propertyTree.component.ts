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
import * as angular from 'angular';

import { every, filter, some, has, concat, map, merge, includes } from 'lodash';

const template = require('./propertyTree.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:propertyTree
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires shared.service:utilService
 * @requires shared.service:prefixes
 *
 * @description
 * `propertyTree` is a component which creates a `div` containing a {@link shared.component:searchBar}
 * and hierarchy of {@link ontology-editor.component:treeItem}. When search text is provided, the hierarchy filters
 * what is shown based on value matches with predicates in the
 * {@link shared.service:ontologyManagerService entityNameProps}.
 *
 * @param {Object[]} datatypeProps An array which represents a flattened list of data properties
 * @param {Object[]} objectProps An array which represents a flattened list of object properties
 * @param {Object[]} annotationProps An array which represents a flattened list of annotation properties
 * @param {Function} updateSearch A function to update the state variable used to track the search filter text
 */
const propertyTreeComponent = {
    template,
    bindings: {
        datatypeProps: '<',
        objectProps: '<',
        annotationProps: '<',
        index: '<',
        updateSearch: '&',
        branchId: '<'
    },
    controllerAs: 'dvm',
    controller: propertyTreeComponentCtrl
};

propertyTreeComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService', 'utilService', 'prefixes', 'INDENT'];

function propertyTreeComponentCtrl(ontologyManagerService, ontologyStateService, utilService, prefixes, INDENT) {
    var dvm = this;
    var om = ontologyManagerService;
    var util = utilService;
    dvm.indent = INDENT;
    dvm.os = ontologyStateService;
    dvm.searchText = '';
    dvm.filterText = '';
    dvm.flatPropertyTree = [];
    dvm.filteredHierarchy = [];
    dvm.preFilteredHierarchy = [];
    dvm.midFilteredHierarchy = [];
    dvm.activeTab = '';
    dvm.dropdownFilterActive = false;
    dvm.activeEntityFilter = {
        name: 'Active Entities Only',
        checked: false,
        flag: false, 
        filter: function(node) {
            var match = true;
            if (node.entity.hasOwnProperty('mobi')) {
                if (node.entity.mobi.imported) {
                    match = false;
                }
            }
            return match;
        }
    };
    dvm.dropdownFilters = [angular.copy(dvm.activeEntityFilter)];

    dvm.$onInit = function() {
        dvm.activeTab = dvm.os.getActiveKey();
        dvm.flatPropertyTree = constructFlatPropertyTree();
        update();
    }
    dvm.$onChanges = function(changesObj) {
        if (!changesObj.datatypeProps || !changesObj.datatypeProps.isFirstChange()) {
            if (changesObj.branchId) {
                removeFilters();
            }
            dvm.flatPropertyTree = constructFlatPropertyTree();
            update();
        }
    }
    dvm.$onDestroy = function() {
        if (dvm.os.listItem.editorTabStates) {
            dvm.os.listItem.editorTabStates.properties.index = 0;
        }
    }
    function removeFilters() {
        dvm.dropdownFilterActive = false;
        dvm.dropdownFilters = [angular.copy(dvm.activeEntityFilter)];
        dvm.searchText = '';
        dvm.filterText = '';
    }
    dvm.clickItem = function(entityIRI) {
        dvm.os.selectItem(entityIRI, undefined, dvm.os.listItem.editorTabStates.properties.targetedSpinnerId);
    }
    dvm.onKeyup = function() {
        dvm.filterText = dvm.searchText;
        dvm.dropdownFilterActive = some(dvm.dropdownFilters, 'flag');
        update();
    }
    dvm.shouldFilter = function() {
        return (dvm.filterText || dvm.dropdownFilterActive);
    }
    dvm.toggleOpen = function(node) {
        node.isOpened = !node.isOpened;
        if (!node.title) {
            dvm.os.listItem.editorTabStates[dvm.activeTab].open[node.joinedPath] = node.isOpened;
        } else {
            node.set(dvm.os.listItem.ontologyRecord.recordId, node.isOpened);
            dvm.os.listItem.editorTabStates[dvm.activeTab].open[node.title] = node.isOpened;
        }
        dvm.filteredHierarchy = filter(dvm.preFilteredHierarchy, dvm.isShown);
    }
    dvm.matchesSearchFilter = function(node) {
        var searchMatch = false;
        // Check all possible name fields and entity fields to see if the value matches the search text
        some(om.entityNameProps, key => some(node.entity[key], value => {
            if (value['@value'].toLowerCase().includes(dvm.filterText.toLowerCase()))
                searchMatch = true;
        }));

        if (searchMatch) {
            return true;
        }

        // Check if beautified entity id matches search text
        if (util.getBeautifulIRI(node.entity['@id']).toLowerCase().includes(dvm.filterText.toLowerCase())) {
            searchMatch = true;
        }
        
        return searchMatch;
    }
    // Start at the current node and go up through the parents marking each path as an iriToOpen. If a path is already present in dvm.os.listItem.editorTabStates[dvm.activeTab].open, it means it was already marked as an iriToOpen by another one of it's children. In that scenario we know all of it's parents will also be open, and we can break out of the loop.
    dvm.openAllParents = function(node) {
        for (var i = node.path.length - 1; i > 1; i--) {
            var fullPath = dvm.os.joinPath(node.path.slice(0, i));

            if (dvm.os.listItem.editorTabStates[dvm.activeTab].open[fullPath]) {
                break;
            }

            dvm.os.listItem.editorTabStates[dvm.activeTab].open[fullPath] = true;
        }
    }
    dvm.openEntities = function(node) {
        if (node.title) {
            var toOpen = dvm.os.listItem.editorTabStates[dvm.activeTab].open[node.title];
            if (toOpen) {
                if (!node.isOpened) {
                    node.isOpened = true;
                    node.set(dvm.os.listItem.ontologyRecord.recordId, true);
                }
                node.displayNode = true;
            }
            return true;
        } else {
            var toOpen = dvm.os.listItem.editorTabStates[dvm.activeTab].open[node.joinedPath];
            if (toOpen) {
                if (!node.isOpened) {
                    node.isOpened = true;
                }
                node.displayNode = true; 
            }
            return true;
        }
    }
    dvm.searchFilter = function (node) {
        delete node.underline;
        delete node.parentNoMatch;
        delete node.displayNode;

        if (node.title) {
            node.isOpened = node.get(dvm.os.listItem.ontologyRecord.recordId);
            if (dvm.shouldFilter()) {
                node.parentNoMatch = true;
            } else {
                dvm.os.listItem.editorTabStates[dvm.activeTab].open[node.title] = node.isOpened;
            }
        } else {
            if (dvm.shouldFilter()) {
                delete node.isOpened;
                var match = false;
                if (dvm.matchesSearchFilter(node) && dvm.matchesDropdownFilters(node)) {
                    match = true;
                    dvm.openAllParents(node);
                    node.underline = true;
                    if (includes(node.entity['@type'], prefixes.owl + 'DatatypeProperty')) {
                        dvm.os.listItem.editorTabStates[dvm.activeTab].open['Data Properties'] = true;
                        delete node.parentNoMatch;
                    }
                    if (includes(node.entity['@type'], prefixes.owl + 'ObjectProperty')) {
                        dvm.os.listItem.editorTabStates[dvm.activeTab].open['Object Properties'] = true;
                        delete node.parentNoMatch;
                    }
                    if (includes(node.entity['@type'], prefixes.owl + 'AnnotationProperty')) {
                        dvm.os.listItem.editorTabStates[dvm.activeTab].open['Annotation Properties'] = true;
                        delete node.parentNoMatch;
                    }
                }
                if (!match && node.hasChildren) {
                    node.parentNoMatch = true;
                    return true;
                }
                return match;
            }
        }
        return true;
    }
    dvm.matchesDropdownFilters = function(node) {
        return every(dvm.dropdownFilters, filter => filter.flag ? filter.filter(node) : true);
    }
    dvm.isShown = function (node) {
        var displayNode = !has(node, 'entityIRI') || (dvm.os.areParentsOpen(node, dvm.activeTab) && node.get(dvm.os.listItem.ontologyRecord.recordId));
        if (dvm.shouldFilter() && node.parentNoMatch) {
            if (node.displayNode === undefined) {
                return false;
            } else {
                return displayNode && node.displayNode;
            }
        }
        return displayNode;
    }

    function update() {
        if (dvm.shouldFilter()) {
            dvm.os.listItem.editorTabStates[dvm.activeTab].open = {};
        }
        dvm.updateSearch({value: dvm.filterText});
        dvm.preFilteredHierarchy = dvm.flatPropertyTree.filter(dvm.searchFilter);
        dvm.midFilteredHierarchy = dvm.preFilteredHierarchy.filter(dvm.openEntities);
        dvm.filteredHierarchy = dvm.midFilteredHierarchy.filter(dvm.isShown);
    }
    function addGetToArrayItems(array, get) {
        return map(array, item => merge(item, {get}));
    }
    function constructFlatPropertyTree() {
        var result = [];
        if (dvm.datatypeProps !== undefined && dvm.datatypeProps.length) {
            result.push({
                title: 'Data Properties',
                get: dvm.os.getDataPropertiesOpened,
                set: dvm.os.setDataPropertiesOpened
            });
            result = concat(result, addGetToArrayItems(dvm.datatypeProps, dvm.os.getDataPropertiesOpened));
        }
        if (dvm.objectProps !== undefined && dvm.objectProps.length) {
            result.push({
                title: 'Object Properties',
                get: dvm.os.getObjectPropertiesOpened,
                set: dvm.os.setObjectPropertiesOpened
            });
            result = concat(result, addGetToArrayItems(dvm.objectProps, dvm.os.getObjectPropertiesOpened));
        }
        if (dvm.annotationProps !== undefined && dvm.annotationProps.length) {
            result.push({
                title: 'Annotation Properties',
                get: dvm.os.getAnnotationPropertiesOpened,
                set: dvm.os.setAnnotationPropertiesOpened
            });
            result = concat(result, addGetToArrayItems(dvm.annotationProps, dvm.os.getAnnotationPropertiesOpened));
        }
        return result;
    }
}

export default propertyTreeComponent;