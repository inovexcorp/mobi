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
        /**
         * @ngdoc overview
         * @name propertyHierarchyBlock
         *
         * @description
         * The `propertyHierarchyBlock` module only provides the `propertyHierarchyBlock` directive which creates a
         * section for displaying the properties in an ontology.
         */
        .module('propertyHierarchyBlock', [])
        /**
         * @ngdoc directive
         * @name propertyHierarchyBlock.directive:propertyHierarchyBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyManager.service:ontologyManagerService
         *
         * @description
         * `propertyHierarchyBlock` is a directive that creates a section that displays a manual hierarchy tree of the
         * data, object, and annotation properties in the current
         * {@link ontologyState.service:ontologyStateService selected ontology} within separate "folders".The directive
         * is replaced by the contents of its template.
         */
        .directive('propertyHierarchyBlock', propertyHierarchyBlock);

        propertyHierarchyBlock.$inject = ['ontologyStateService', 'ontologyManagerService', 'INDENT'];

        function propertyHierarchyBlock(ontologyStateService, ontologyManagerService, INDENT) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/propertyHierarchyBlock/propertyHierarchyBlock.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.indent = INDENT;
                    dvm.os = ontologyStateService;
                    dvm.om = ontologyManagerService;

                    dvm.isShown = function(node) {
                        return !_.has(node, 'entityIRI') || (dvm.os.areParentsOpen(node) && node.get(dvm.os.listItem.ontologyRecord.recordId));
                    }

                    dvm.flatPropertyTree = constructFlatPropertyTree();

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

                    $scope.$watch('dvm.os.listItem.dataProperties.flat', () => {
                        dvm.flatPropertyTree = constructFlatPropertyTree();
                    });
                    $scope.$watch('dvm.os.listItem.objectProperties.flat', () => {
                        dvm.flatPropertyTree = constructFlatPropertyTree();
                    });
                    $scope.$watch('dvm.os.listItem.annotations.flat', () => {
                        dvm.flatPropertyTree = constructFlatPropertyTree();
                    });
                }]
            }
        }
})();
