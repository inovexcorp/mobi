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

import { filter, join, has, findIndex, find, some, pick, get, every } from 'lodash';

const template = require('./everythingTree.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:everythingTree
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires shared.service:utilService
 *
 * @description
 * `everythingTree` is a component that creates a a `div` containing a {@link shared.component:searchBar} and
 * hierarchy of {@link ontology-editor.component:treeItem}. When search text is provided, the hierarchy filters
 * what is shown based on value matches with predicates in the
 * {@link shared.service:ontologyManagerService entityNameProps}.
 *
 * @param {Object[]} hierarchy An array which represents a flattened everything hierarchy
 * @param {Function} updateSearch A function to update the state variable used to track the search filter text
 */
const everythingTreeComponent = {
    template,
    bindings: {
        updateSearch: '&',
        hierarchy: '<'
    },
    controllerAs: 'dvm',
    controller: everythingTreeComponentCtrl
};

everythingTreeComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService', 'utilService', 'INDENT'];

function everythingTreeComponentCtrl(ontologyManagerService, ontologyStateService, utilService, INDENT) {
    var dvm = this;
    var util = utilService
    dvm.indent = INDENT;
    dvm.om = ontologyManagerService;
    dvm.os = ontologyStateService;
    dvm.searchText = '';
    dvm.filterText = '';
    dvm.filteredHierarchy = [];
    dvm.dropdownFilterActive = false;
    dvm.preFilteredHierarchy = [];
    dvm.activeEntityFilter = {
        name: 'Active Entities Only',
        checked: false,
        flag: false, 
        filter: node => {
            var match = true;
            if (node.hasOwnProperty('mobi')) {
                if (node.mobi.imported) {
                    match = false;
                }
            }
            return match;
        }
    };
    dvm.dropdownFilters = [angular.copy(dvm.activeEntityFilter)];

    dvm.$onInit = function() {
        update();
    }
    dvm.$onChanges = function(changesObj) {
        clearSelection();
        if (!changesObj.hierarchy.isFirstChange()) {
            update();
        }
    }
    dvm.onKeyup = function() {
        dvm.filterText = dvm.searchText;
        dvm.dropdownFilterActive = some(dvm.dropdownFilters, 'flag')
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
    dvm.processFilters = function(node) {
        delete node.underline;
        delete node.parentNoMatch;
        delete node.displayNode;
        delete node.isOpened;
        if (node.title) {  // If node is a folder
            if (dvm.filterText || dvm.dropdownFilterActive) {
                node.set(dvm.os.listItem.ontologyRecord.recordId, true);
            }
            node.isOpened = node.get(dvm.os.listItem.ontologyRecord.recordId);
        } else {
            node.isOpened = dvm.os.getOpened(dvm.os.joinPath(node.path));
            if (dvm.filterText || dvm.dropdownFilterActive) {
                var match = false;

                if (dvm.matchesSearchFilter(node) && dvm.matchesDropdownFilters(node)) {
                    match = true;
                    dvm.openAllParents(node);
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
    dvm.matchesSearchFilter = function(node) {
        var searchMatch = true;
        if (dvm.filterText) {
            searchMatch = false;
            var searchValues = pick(node, dvm.om.entityNameProps);

            // Check all possible name fields and entity fields to see if the value matches the search text
            some(Object.keys(searchValues), key => some(searchValues[key], value => {
                if (value['@value'].toLowerCase().includes(dvm.filterText.toLowerCase()))
                    searchMatch = true;
            }));

            // Check if beautified entity id matches search text
            if (util.getBeautifulIRI(node['@id']).toLowerCase().includes(dvm.filterText.toLowerCase())) {
                searchMatch = true;
            }
        }
        return searchMatch;
    }
    dvm.openAllParents = function(node) {
        // set path to the ontology record
        var path = node.path[0];

        // only loops through if node.path has at least 3 items. Last entry in node.path will be the current child node that matched. The first entry will just be the ontology record. This loop is just looping through all the parents up the line.

        // Set all the parents up the line to opened and diplayNode = true.
        for (var i = 1; i < node.path.length - 1; i++) {

            // set iri to the concept IRI we are looking at
            var iri = node.path[i];

            // update path to be ontology record <dot> concept IRI
            path = path + '.' + iri;
            // open the path
            dvm.os.setOpened(path, true);

            // Go through the whole hierarchy and find the concept IRI we are looking at
            // Set the same IRI to opened in both the ontology state service and dvm.hierarchy
            var parentNode = find(dvm.hierarchy, {'@id': iri});

            parentNode.isOpened = true;
            parentNode.displayNode = true;
        }
    }
    dvm.isShown = function(node) {
        var displayNode = !has(node, '@id') || (has(node, 'get') && node.get(dvm.os.listItem.ontologyRecord.recordId)) || (!has(node, 'get') && node.indent > 0 && dvm.os.areParentsOpen(node)) || (node.indent === 0 && get(node, 'path', []).length === 2);
        // If the Properties folder is the last item in the preFilteredHierarchy, we know there are no matching properties, so we don't show
        if ((dvm.dropdownFilterActive || dvm.filterText) && node['title']) {
            var position = findIndex(dvm.preFilteredHierarchy, 'title');
            if (position === dvm.preFilteredHierarchy.length - 1) {
                node.set(dvm.os.listItem.ontologyRecord.recordId, false);
                return false;
            }
        }
        if ((dvm.dropdownFilterActive || dvm.filterText) && node.parentNoMatch) {
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
        dvm.preFilteredHierarchy = filter(dvm.hierarchy, dvm.processFilters);
        dvm.filteredHierarchy = filter(dvm.preFilteredHierarchy, dvm.isShown);
    }
    function clearSelection() {
        dvm.searchText = '';
        dvm.filterText = '';
        dvm.dropdownFilterActive = false;
        dvm.dropdownFilters = [angular.copy(dvm.activeEntityFilter)];
    }
}

export default everythingTreeComponent;