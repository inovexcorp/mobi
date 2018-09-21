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
         * @name overviewTab
         *
         * @description
         * The `overviewTab` module only provides the `overviewTab` directive which creates a page for viewing an
         * overview about the classes and properties in an ontology.
         */
        .module('overviewTab', [])
        /**
         * @ngdoc directive
         * @name overviewTab.directive:overviewTab
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `overviewTab` is a directive that creates a page containing the
         * {@link associationBlock.directive:associationBlock class and property list} of the current
         * {@link ontologyState.service:ontologyStateService selected ontology} and information about a
         * selected item from that list. The selected entity display includes a
         * {@link selectedDetails.directive:selectedDetails}, a button to delete the entity, an
         * {@link annotationBlock.directive:annotationBlock}, an {@link axiomBlock.directive:axiomBlock}, and a
         * {@link usagesBlock.directive:usagesBlock}. If the selected entity is a property, a
         * {@link characteristicsRow.directive:characteristicsRow} is also displayed. The directive houses the method
         * for opening the modal to delete an entity. The directive is replaced by the contents of its template.
         */
        .directive('overviewTab', overviewTab);

        overviewTab.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'modalService'];

        function overviewTab(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;

                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', dvm.deleteEntity);
                    }
                    dvm.deleteEntity = function() {
                        if (om.isClass(dvm.os.listItem.selected)) {
                            ontoUtils.deleteClass();
                        } else if (om.isObjectProperty(dvm.os.listItem.selected)) {
                            ontoUtils.deleteObjectProperty();
                        } else if (om.isDataTypeProperty(dvm.os.listItem.selected)) {
                            ontoUtils.deleteDataTypeProperty();
                        }
                    }
                },
                templateUrl: 'modules/ontology-editor/directives/overviewTab/overviewTab.html'
            }
        }
})();
