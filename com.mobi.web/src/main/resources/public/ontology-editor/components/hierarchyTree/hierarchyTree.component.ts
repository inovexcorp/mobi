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

import { join, filter, some, pick, find, every } from 'lodash';

import './hierarchyTree.component.scss';

const template = require('./hierarchyTree.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:hierarchyTree
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires ontology-editor.service:ontologyUtilsManagerService
 * @requires shared.service:utilService
 * @requires shared.service:prefixes
 *
 * @description
 * `hierarchyTree` is a component which creates a `div` containing a {@link shared.component:searchBar} and
 * hierarchy of {@link ontology-editor.component:treeItem}. When search text is provided, the hierarchy filters what is
 * shown based on value matches with predicates in the {@link shared.service:ontologyManagerService entityNameProps}.
 *
 * @param {Object[]} hierarchy An array which represents a flattened hierarchy
 * @param {Function} updateSearch A function to update the state variable used to track the search filter text
 */
const hierarchyTreeComponent = {
    template,
    bindings: {
        hierarchy: '<',
        index: '<',
        updateSearch: '&',
        resetIndex: '&',
        clickItem: '&?'
    },
    controllerAs: 'dvm',
    controller: hierarchyTreeComponentCtrl
};

hierarchyTreeComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService', 'utilService', 'INDENT'];

function hierarchyTreeComponentCtrl(ontologyManagerService, ontologyStateService, utilService, INDENT) {
    var dvm = this;
    var om = ontologyManagerService;
    var util = utilService;
    dvm.indent = INDENT;
    dvm.os = ontologyStateService;
    dvm.searchText = '';
    dvm.filterText = '';
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
        update();
    }
    dvm.$onChanges = function(changesObj) {
        clearSelection();
        if (!changesObj.hierarchy || !changesObj.hierarchy.isFirstChange()) {
            update();
        }
    }
    dvm.$onDestroy = function() {
        if (dvm.os.listItem.editorTabStates) {
            dvm.resetIndex();
        }
    }
    dvm.click = function(entityIRI) {
        dvm.os.selectItem(entityIRI);
        if (dvm.clickItem) {
            dvm.clickItem({iri: entityIRI});
        }
    }
    dvm.onKeyup = function() {
        dvm.filterText = dvm.searchText;
        dvm.dropdownFilterActive = some(dvm.dropdownFilters, 'flag');
        update();
    }
    dvm.toggleOpen = function(node) {
        node.isOpened = !node.isOpened;
        dvm.os.setOpened(join(node.path, '.'), node.isOpened);
        dvm.filteredHierarchy = filter(dvm.preFilteredHierarchy, dvm.isShown);
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
    dvm.matchesDropdownFilters = function(node) {
        return every(dvm.dropdownFilters, filter => filter.flag ? filter.filter(node) : true);
    }
    dvm.processFilters = function(node) {
        delete node.underline;
        delete node.parentNoMatch;
        delete node.displayNode;
        delete node.entity;
        delete node.isOpened;

        node.entity = dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, node.entityIRI);

        node.isOpened = dvm.os.getOpened(dvm.os.joinPath(node.path));
        if (dvm.filterText || dvm.dropdownFilterActive) {
            var match = false;
            
            if(dvm.matchesSearchFilter(node) && dvm.matchesDropdownFilters(node)) {
                match = true;
                dvm.openAllParents(node);
                node.underline = true;
            }

            // Always return true for parents, but if the parent is not a match, set a property called parentNoMatch = true
            if (!match && node.hasChildren) {
                node.parentNoMatch = true;
                return true;
            }
            return match;
        } else {
            return true;
        }
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
            // I think the purpose of these lines and the previous is to set the same IRI to opened in both the ontology state service and dvm.hierarchy
            var parentNode = find(dvm.hierarchy, {'entityIRI': iri});

            parentNode.isOpened = true;
            parentNode.displayNode = true;
        }
    }
    // if node.displayNode is true then we know one of it's children matched somewhere down the line
    dvm.isShown = function (node) {
        // This will run if there is no filter text as well
        // Only show roots unless parent is opened
        var displayNode = (node.indent > 0 && dvm.os.areParentsOpen(node)) || node.indent === 0;
        // if there is a search term and it is a parent that did not match
        if ((dvm.dropdownFilterActive || dvm.filterText) && node.parentNoMatch) {
            // if the node's displayNode wasn't set, don't show
            if (node.displayNode === undefined) {
                return false;
            } else {
                // if it would otherwise be displayed prior to search (displayNode) and it has a child that matched (node.displayNode)... show
                return displayNode && node.displayNode;
            }
        }
        return displayNode;
    }

    function update() {
        dvm.updateSearch({value: dvm.filterText}); // set dvm.os.listItem.editorTabStates.concepts.searchText = filterText

        dvm.preFilteredHierarchy = filter(dvm.hierarchy, dvm.processFilters); // filter(dvm.os.listItem.concepts.flat, with dvm.processFilters function)
        dvm.filteredHierarchy = filter(dvm.preFilteredHierarchy, dvm.isShown);
    }
    function clearSelection() {
        dvm.searchText = '';
        dvm.filterText = '';
        dvm.dropdownFilterActive = false;
        dvm.dropdownFilters = [angular.copy(dvm.activeEntityFilter)];
    }
}

export default hierarchyTreeComponent;