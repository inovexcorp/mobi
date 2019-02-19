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
         * @name propertiesTab
         *
         * @description
         * The `propertiesTab` module only provides the `propertiesTab` directive which creates a page for viewing the
         * properties in an ontology.
         */
        .module('propertiesTab', [])
        /**
         * @ngdoc directive
         * @name propertiesTab.directive:propertiesTab
         * @scope
         * @restrict E
         * @requires shared.service:ontologyManagerService
         * @requires shared.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires shared.service:modalService
         *
         * @description
         * `propertiesTab` is a directive that creates a page containing the
         * {@link propertyHierarchyBlock.directive:propertyHierarchyBlock} of the current
         * {@link shared.service:ontologyStateService selected ontology} and information about a selected
         * property from that list. The selected property display includes a
         * {@link selectedDetails.directive:selectedDetails}, a button to delete the property, an
         * {@link annotationBlock.directive:annotationBlock}, an {@link axiomBlock.directive:axiomBlock}, a
         * {@link characteristicsRow.directive:characteristicsRow}, and a {@link usagesBlock.directive:usagesBlock}.
         * The directive houses the method for opening a modal for deleting propertyes. The directive is replaced by the
         * contents of its template.
         */
        .directive('propertiesTab', propertiesTab);

        propertiesTab.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'modalService'];

        function propertiesTab(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/propertiesTab/propertiesTab.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var ontoUtils = ontologyUtilsManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;

                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', dvm.deleteProperty);
                    }
                    dvm.deleteProperty = function() {
                        if (dvm.om.isObjectProperty(dvm.os.listItem.selected)) {
                            ontoUtils.deleteObjectProperty();
                        } else if (dvm.om.isDataTypeProperty(dvm.os.listItem.selected)) {
                            ontoUtils.deleteDataTypeProperty();
                        } else if (dvm.om.isAnnotation(dvm.os.listItem.selected)) {
                            ontoUtils.deleteAnnotationProperty();
                        }
                    }
                }
            }
        }
})();
