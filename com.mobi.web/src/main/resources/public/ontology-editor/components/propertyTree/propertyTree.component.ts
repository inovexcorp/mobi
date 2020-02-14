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

import { join, filter, pick, some, find, has, concat, map, merge, every } from 'lodash';

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
        updateSearch: '&'
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
        dvm.flatPropertyTree = constructFlatPropertyTree();
        update();
    }
    dvm.$onChanges = function(changesObj) {
        clearSelection();
        if (!changesObj.datatypeProps || !changesObj.datatypeProps.isFirstChange()) {
            dvm.flatPropertyTree = constructFlatPropertyTree();
            update();
        }
    }
    dvm.$onDestroy = function() {
        if (dvm.os.listItem.editorTabStates) {
            dvm.os.listItem.editorTabStates.properties.index = 0;
        }
    }
    dvm.onKeyup = function() {
        dvm.filterText = dvm.searchText;
        dvm.dropdownFilterActive = some(dvm.dropdownFilters, 'flag');
        update();
    }
    dvm.toggleOpen = function(node) {
        node.isOpened = !node.isOpened;
        if (!node.title) {
            dvm.os.setOpened(join(node.path, '.'), node.isOpened);
        } else {
            node.set(dvm.os.listItem.ontologyRecord.recordId, node.isOpened);
        }
        dvm.filteredHierarchy = filter(dvm.preFilteredHierarchy, dvm.isShown);
    }
    dvm.shouldFilter = function() {
        return (dvm.filterText || dvm.dropdownFilterActive);
    }
    dvm.matchesSearchFilter = function(node) {
        var searchMatch = true;
        if (dvm.filterText) {
            searchMatch = false;
            var searchValues = pick(node.entity, om.entityNameProps);

            // Check all possible name fields and entity fields to see if the value matches the search text
            some(Object.keys(searchValues), key => some(searchValues[key], value => {
                if (value['@value'].toLowerCase().includes(dvm.filterText.toLowerCase()))
                    searchMatch = true;
            }));

            // Check if beautified entity id matches search text
            if (util.getBeautifulIRI(node.entity['@id']).toLowerCase().includes(dvm.filterText.toLowerCase())) {
                searchMatch = true;
            }
        }
        return searchMatch;
    }
    dvm.openAllParents = function(node) {
        var path = node.path[0];
        for (var i = 1; i < node.path.length - 1; i++) {
            var iri = node.path[i];
            path = path + '.' + iri;
            dvm.os.setOpened(path, true);

            var parentNode = find(dvm.flatPropertyTree, {'entityIRI': iri});
            parentNode.isOpened = true;
            parentNode.displayNode = true;
        }
    }
    dvm.openPropertyFolders = function(node) {
        if (node.entity['@type'][0] === prefixes.owl + 'DatatypeProperty') {
            var propertyFolder = find(dvm.flatPropertyTree, {title: 'Data Properties'});
            propertyFolder.set(dvm.os.listItem.ontologyRecord.recordId, true);
            propertyFolder.displayNode = true;
            propertyFolder.isOpened = true;
            delete node.parentNoMatch;
        }
        if (node.entity['@type'][0] === prefixes.owl + 'ObjectProperty') {
            var propertyFolder = find(dvm.flatPropertyTree, {title: 'Object Properties'});
            propertyFolder.set(dvm.os.listItem.ontologyRecord.recordId, true);
            propertyFolder.displayNode = true;
            propertyFolder.isOpened = true;
            delete node.parentNoMatch;
        }
        if (node.entity['@type'][0] === prefixes.owl + 'AnnotationProperty') {
            var propertyFolder = find(dvm.flatPropertyTree, {title: 'Annotation Properties'});
            propertyFolder.set(dvm.os.listItem.ontologyRecord.recordId, true);
            propertyFolder.displayNode = true;
            propertyFolder.isOpened = true;
            delete node.parentNoMatch;
        }
    }
    dvm.processFilters = function (node) {
        delete node.underline;
        delete node.parentNoMatch;
        delete node.displayNode;
        delete node.isOpened;
        delete node.entity;
        if (node.title) {
            if (dvm.shouldFilter()) {
                node.parentNoMatch = true;
            }
            node.isOpened = node.get(dvm.os.listItem.ontologyRecord.recordId);
        } else {
            node.isOpened = dvm.os.getOpened(dvm.os.joinPath(node.path));
            node.entity = dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, node.entityIRI);
            if (dvm.shouldFilter()) {
                var match = false;
                if (dvm.matchesSearchFilter(node) && dvm.matchesDropdownFilters(node)) {
                    match = true;
                    dvm.openAllParents(node);
                    dvm.openPropertyFolders(node);
                    node.underline = true;
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
        var displayNode = !has(node, 'entityIRI') || (dvm.os.areParentsOpen(node) && node.get(dvm.os.listItem.ontologyRecord.recordId));
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
        dvm.updateSearch({value: dvm.filterText});
        dvm.preFilteredHierarchy = filter(dvm.flatPropertyTree, dvm.processFilters);
        dvm.filteredHierarchy = filter(dvm.preFilteredHierarchy, dvm.isShown);
    }
    function addGetToArrayItems(array, get) {
        return map(array, item => merge(item, {get}));
    }
    function clearSelection() {
        dvm.searchText = '';
        dvm.filterText = '';
        dvm.dropdownFilterActive = false;
        dvm.dropdownFilters = [angular.copy(dvm.activeEntityFilter)];
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