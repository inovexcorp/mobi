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
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name ontology-editor.component:propertyTree
     * @requires shared.service:ontologyManagerService
     * @requires shared.service:ontologyStateService
     * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
     * @requires shared.service:utilService
     * @requires shared.service:prefixes
     *
     * @description
     * `propertyTree` is a component which creates a `div` containing a {@link shared.component:searchBar}
     * and hierarchy of {@link treeItem.directive:treeItem}. When search text is provided, the hierarchy filters what
     * is shown based on value matches with predicates in the {@link shared.service:ontologyManagerService entityNameProps}.
     *
     * @param {Object[]} datatypeProps An array which represents a flattened list of data properties
     * @param {Object[]} objectProps An array which represents a flattened list of object properties
     * @param {Object[]} annotationProps An array which represents a flattened list of annotation properties
     * @param {Function} updateSearch A function to update the state variable used to track the search filter text
     */
    const propertyTreeComponent = {
        templateUrl: 'ontology-editor/components/propertyTree/propertyTree.component.html',
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

    propertyTreeComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'utilService', 'prefixes', 'INDENT'];

    function propertyTreeComponentCtrl(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, utilService, prefixes, INDENT) {
        var dvm = this;
        var om = ontologyManagerService;
        var util = utilService;
        dvm.indent = INDENT;
        dvm.os = ontologyStateService;
        dvm.ou = ontologyUtilsManagerService;
        dvm.searchText = '';
        dvm.filterText = '';
        dvm.flatPropertyTree = [];
        dvm.filteredHierarchy = [];
        dvm.preFilteredHierarchy = [];

        dvm.$onInit = function() {
            dvm.flatPropertyTree = constructFlatPropertyTree();
            update();
        }
        dvm.$onChanges = function(changesObj) {
            if (!changesObj.datatypeProps.isFirstChange() && !changesObj.objectProps.isFirstChange() && !changesObj.annotationProps.isFirstChange()) {
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
            update();
        }
        dvm.toggleOpen = function(node) {
            node.isOpened = !node.isOpened;
            if (!node.title) {
                dvm.os.setOpened(_.join(node.path, '.'), node.isOpened);
            } else {
                node.set(dvm.os.listItem.ontologyRecord.recordId, node.isOpened);
            }
            dvm.filteredHierarchy = _.filter(dvm.preFilteredHierarchy, dvm.isShown);
        }
        dvm.searchFilter = function (node) {
            delete node.underline;
            delete node.parentNoMatch;
            delete node.displayNode;
            delete node.isOpened;
            delete node.entity;
            node.isOpened = dvm.os.getOpened(dvm.os.joinPath(node.path));
            if (node.title) {
                if (dvm.filterText) {
                    node.parentNoMatch = true;
                }
                node.isOpened = node.get(dvm.os.listItem.ontologyRecord.recordId);
            } else {
                node.entity = dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, node.entityIRI);
                if (dvm.filterText) {
                    var searchValues = _.pick(node.entity, om.entityNameProps);
                    var match = false;
                    _.some(Object.keys(searchValues), key => _.some(searchValues[key], value => {
                        if (value['@value'].toLowerCase().includes(dvm.filterText.toLowerCase()))
                            match = true;
                    }));
                    if (util.getBeautifulIRI(node.entity['@id']).toLowerCase().includes(dvm.filterText.toLowerCase())) {
                        match = true;
                    }
                    if (match) {
                        var path = node.path[0];
                        for (var i = 1; i < node.path.length - 1; i++) {
                            var iri = node.path[i];
                            path = path + '.' + iri;
                            dvm.os.setOpened(path, true);

                            var parentNode = _.find(dvm.flatPropertyTree, {'entityIRI': iri});
                            parentNode.isOpened = true;
                            parentNode.displayNode = true;
                        }
                        node.underline = true;

                        if (node.entity['@type'][0] === prefixes.owl + 'DatatypeProperty') {
                            var propertyFolder = _.find(dvm.flatPropertyTree, {title: 'Data Properties'});
                            propertyFolder.set(dvm.os.listItem.ontologyRecord.recordId, true);
                            propertyFolder.displayNode = true;
                            propertyFolder.isOpened = true;
                            delete node.parentNoMatch;
                        }
                        if (node.entity['@type'][0] === prefixes.owl + 'ObjectProperty') {
                            var propertyFolder = _.find(dvm.flatPropertyTree, {title: 'Object Properties'});
                            propertyFolder.set(dvm.os.listItem.ontologyRecord.recordId, true);
                            propertyFolder.displayNode = true;
                            propertyFolder.isOpened = true;
                            delete node.parentNoMatch;
                        }
                        if (node.entity['@type'][0] === prefixes.owl + 'AnnotationProperty') {
                            var propertyFolder = _.find(dvm.flatPropertyTree, {title: 'Annotation Properties'});
                            propertyFolder.set(dvm.os.listItem.ontologyRecord.recordId, true);
                            propertyFolder.displayNode = true;
                            propertyFolder.isOpened = true;
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
        dvm.isShown = function (node) {
            var displayNode = !_.has(node, 'entityIRI') || (dvm.os.areParentsOpen(node) && node.get(dvm.os.listItem.ontologyRecord.recordId));
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
            dvm.updateSearch({value: dvm.filterText});
            dvm.preFilteredHierarchy = _.filter(dvm.flatPropertyTree, dvm.searchFilter);
            dvm.filteredHierarchy = _.filter(dvm.preFilteredHierarchy, dvm.isShown);
        }
        function addGetToArrayItems(array, get) {
            return _.map(array, item => _.merge(item, {get}));
        }
        function constructFlatPropertyTree() {
            var result = [];
            if (dvm.datatypeProps !== undefined && dvm.datatypeProps.length) {
                result.push({
                    title: 'Data Properties',
                    get: dvm.os.getDataPropertiesOpened,
                    set: dvm.os.setDataPropertiesOpened
                });
                result = _.concat(result, addGetToArrayItems(dvm.datatypeProps, dvm.os.getDataPropertiesOpened));
            }
            if (dvm.objectProps !== undefined && dvm.objectProps.length) {
                result.push({
                    title: 'Object Properties',
                    get: dvm.os.getObjectPropertiesOpened,
                    set: dvm.os.setObjectPropertiesOpened
                });
                result = _.concat(result, addGetToArrayItems(dvm.objectProps, dvm.os.getObjectPropertiesOpened));
            }
            if (dvm.annotationProps !== undefined && dvm.annotationProps.length) {
                result.push({
                    title: 'Annotation Properties',
                    get: dvm.os.getAnnotationPropertiesOpened,
                    set: dvm.os.setAnnotationPropertiesOpened
                });
                result = _.concat(result, addGetToArrayItems(dvm.annotationProps, dvm.os.getAnnotationPropertiesOpened));
            }
            return result;
        }
    }

    angular.module('ontology-editor')
        .component('propertyTree', propertyTreeComponent);
})();