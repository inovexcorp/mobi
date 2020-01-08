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
import { join, filter, pick, some, find, get, has, every } from 'lodash';

const template = require('./individualTree.component.html');

import './individualTree.component.scss';

/**
 * @ngdoc component
 * @name ontology-editor.component:individualTree
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires shared.service:utilService
 * @requires ontology-editor.service:ontologyUtilsManagerService
 *
 * @description
 * `individualTree` is a component that creates a `div` containing a {@link shared.component:searchBar}
 * and hierarchy of {@link ontology-editor.component:treeItem}s of individuals. When search text is provided,
 * the hierarchy filters what is shown based on value matches with predicates in the
 * {@link shared.service:ontologyManagerService entityNameProps}.
 *
 * @param {Object[]} hierarchy An array which represents a flattened individual hierarchy
 * @param {Function} updateSearch A function to update the state variable used to track the search filter text
 */
const individualTreeComponent = {
    template,
    bindings: {
        hierarchy: '<',
        index: '<',
        updateSearch: '&'
    },
    controllerAs: 'dvm',
    controller: individualTreeComponentCtrl
};

individualTreeComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService', 'utilService', 'ontologyUtilsManagerService', 'INDENT'];

function individualTreeComponentCtrl(ontologyManagerService, ontologyStateService, utilService, ontologyUtilsManagerService, INDENT) {
    var dvm = this;
    dvm.indent = INDENT;
    dvm.om = ontologyManagerService;
    dvm.os = ontologyStateService;
    dvm.ontoUtils = ontologyUtilsManagerService;
    dvm.util = utilService;
    dvm.searchText = '';
    dvm.filterText = '';
    dvm.filteredHierarchy = [];
    dvm.preFilteredHierarchy = [];
    dvm.dropdownOpen = false;
    dvm.numDropdownFilters = 0;
    dvm.activeEntityFilter = {
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

    dvm.dropdownFilters = [dvm.activeEntityFilter];

    dvm.$onInit = function() {
        update();
    }
    dvm.$onChanges = function(changesObj) {
        dvm.searchText = '';
        dvm.filterText = '';
        if (!changesObj.hierarchy || !changesObj.hierarchy.isFirstChange()) {
            update();
        }
    }
    dvm.$onDestroy = function() {
        if (dvm.os.listItem.editorTabStates) {
            dvm.os.listItem.editorTabStates.individuals.index = 0;
        }
    }
    dvm.onKeyup = function() {
        dvm.filterText = dvm.searchText;
        dvm.dropdownFilters.forEach(df =>{ df.flag = df.checked});
        dvm.numDropdownFilters = filter(dvm.dropdownFilters, 'flag').length;
        update();
        dvm.dropdownOpen = false;

    }
    dvm.dropdownToggled = function(open) {
        if (!open) {
            dvm.dropdownFilters.forEach(df =>{ df.checked = df.flag});
        }
    }
    dvm.toggleOpen = function(node) {
        node.isOpened = !node.isOpened;
        dvm.os.setOpened(join(node.path, '.'), node.isOpened);
        dvm.filteredHierarchy = filter(dvm.preFilteredHierarchy, dvm.isShown);
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
    dvm.matchesSearchFilter = function(node) {
        var searchMatch = true;
        if (dvm.filterText) {
            searchMatch = false;
            var searchValues = pick(node.entity, dvm.om.entityNameProps);

            // Check all possible name fields and entity fields to see if the value matches the search text
            some(Object.keys(searchValues), key => some(searchValues[key], value => {
                if (value['@value'].toLowerCase().includes(dvm.filterText.toLowerCase()))
                    searchMatch = true;
            }));

            // Check if beautified entity id matches search text
            if (dvm.util.getBeautifulIRI(node.entity['@id']).toLowerCase().includes(dvm.filterText.toLowerCase())) {
                searchMatch = true;
            }
        }
        return searchMatch;

    }
    dvm.matchesDropdownFilters = function(node) {
        return every(dvm.dropdownFilters, filter => {
            if(filter.flag) {
                return filter.filter(node);
            } else {
                return true;
            }
        });
    }
    dvm.shouldFilter = function() {
        return (dvm.filterText || dvm.numDropdownFilters > 0);
    }

    dvm.processFilters = function (node) {
        delete node.underline;
        delete node.parentNoMatch;
        delete node.displayNode;
        delete node.entity;
        delete node.isOpened;
        node.isOpened = dvm.os.getOpened(dvm.os.joinPath(node.path));
        if (node.isClass) {
            if (dvm.shouldFilter()) {
                node.parentNoMatch = true;
            }
        } else {
            node.entity = dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, node.entityIRI);
            if (dvm.shouldFilter()) {
                var match = false;

                if (dvm.matchesSearchFilter(node) && dvm.matchesDropdownFilters(node)) {
                    match = true;
                    dvm.openAllParents(node);
                    node.underline = true;
                }
                return match;
            }
        }
        return true;
    }
    dvm.isShown = function(node) {
        var displayNode = (node.indent > 0 && dvm.os.areParentsOpen(node, dvm.os.getOpened)) || (node.indent === 0 && get(node, 'path', []).length === 2);
        if (dvm.shouldFilter() && node.parentNoMatch) {
            if (node.displayNode === undefined) {
                return false;
            } else {
                return displayNode && node.displayNode;
            }
        }
        return displayNode;
    }
    dvm.isImported = function(entityIRI) {
        return !has(dvm.os.listItem.index, entityIRI);
    }

    function update() {
        dvm.updateSearch({value: dvm.filterText});
        dvm.preFilteredHierarchy = filter(dvm.hierarchy, dvm.processFilters);
        dvm.filteredHierarchy = filter(dvm.preFilteredHierarchy, dvm.isShown);
    }
}

export default individualTreeComponent;
