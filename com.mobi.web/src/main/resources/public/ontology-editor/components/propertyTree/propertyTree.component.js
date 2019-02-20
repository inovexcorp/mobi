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
     * @requires shared.service:prefixes
     *
     * @description
     * `propertyTree` is a component which creates a `div` containing a {@link shared.directive:searchBar}
     * and hierarchy of {@link treeItem.directive:treeItem}. When search text is provided, the hierarchy filters what
     * is shown based on value matches with predicates in the {@link shared.service:ontologyManagerService entityNameProps}.
     *
     * @param {Object[]} dataProps An array which represents a flattened list of data properties
     * @param {Object[]} objectProps An array which represents a flattened list of object properties
     * @param {Object[]} annotationProps An array which represents a flattened list of annotation properties
     * @param {Function} updateSearch A function to update the state variable used to track the search filter text
     */
    const propertyTreeComponent = {
        templateUrl: 'ontology-editor/components/propertyTree/propertyTree.component.html',
        bindings: {
            dataProps: '<',
            objectProps: '<',
            annotationProps: '<',
            updateSearch: '<'
        },
        controllerAs: 'dvm',
        controller: propertyTreeComponentCtrl
    };

    propertyTreeComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'prefixes', 'INDENT'];

    function propertyTreeComponentCtrl(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, prefixes, INDENT) {
        var dvm = this;
        var om = ontologyManagerService;
        dvm.indent = INDENT;
        dvm.os = ontologyStateService;
        dvm.ou = ontologyUtilsManagerService;
        dvm.searchText = '';
        dvm.filterText = '';

        dvm.$onInit = function() {
            dvm.flatPropertyTree = constructFlatPropertyTree();
            update();
        }
        dvm.$onChanges = function() {
            dvm.flatPropertyTree = constructFlatPropertyTree();
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
                    var entity = dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, node.entityIRI);
                    var searchValues = _.pick(entity, om.entityNameProps);
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

                            var parentNode = _.find(dvm.flatPropertyTree, {'entityIRI': iri});
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
        dvm.isShown = function (node) {
            var displayNode = !_.has(node, 'entityIRI') || (dvm.os.areParentsOpen(node) && node.get(dvm.os.listItem.ontologyRecord.recordId));
            if (dvm.filterText && node.parentNoMatch) {
                if (node.displayNode === undefined) {
                    return false;
                } else {
                    return displayNode && node.displayNode;
                }
            }
            if (dvm.filterText && node['title']) {
                var position = _.findIndex(dvm.filteredHierarchy, {'title': node['title']});
                if (position === dvm.filteredHierarchy.length - 1 || (position + 1 < dvm.filteredHierarchy.length - 1 && dvm.filteredHierarchy[position + 1]['title'])) {
                    node.set(dvm.os.listItem.ontologyRecord.recordId, false);
                    return false;
                }
            }
            return displayNode;
        }

        function update() {
            dvm.updateSearch(dvm.filterText);
            dvm.filteredHierarchy = _.filter(dvm.flatPropertyTree, dvm.searchFilter);
        }
        function addGetToArrayItems(array, get) {
            return _.map(array, item => _.merge(item, {get}));
        }
        function constructFlatPropertyTree() {
            var result = [];
            if (dvm.os.listItem.dataProperties.flat.length) {
                result.push({
                    title: 'Data Properties',
                    get: dvm.os.getDataPropertiesOpened,
                    set: dvm.os.setDataPropertiesOpened
                });
                result = _.concat(result, addGetToArrayItems(dvm.os.listItem.dataProperties.flat, dvm.os.getDataPropertiesOpened));
            }
            if (dvm.os.listItem.objectProperties.flat.length) {
                result.push({
                    title: 'Object Properties',
                    get: dvm.os.getObjectPropertiesOpened,
                    set: dvm.os.setObjectPropertiesOpened
                });
                result = _.concat(result, addGetToArrayItems(dvm.os.listItem.objectProperties.flat, dvm.os.getObjectPropertiesOpened));
            }
            if (dvm.os.listItem.annotations.flat.length) {
                result.push({
                    title: 'Annotation Properties',
                    get: dvm.os.getAnnotationPropertiesOpened,
                    set: dvm.os.setAnnotationPropertiesOpened
                });
                result = _.concat(result, addGetToArrayItems(dvm.os.listItem.annotations.flat, dvm.os.getAnnotationPropertiesOpened));
            }
            return result;
        }
    }

    angular.module('ontology-editor')
        .component('propertyTree', propertyTreeComponent);
})();