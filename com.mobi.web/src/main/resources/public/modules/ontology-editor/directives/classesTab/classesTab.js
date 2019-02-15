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
         * @name classesTab
         *
         * @description
         * The `classesTab` module only provides the `classesTab` directive which creates a page for viewing the
         * classes in an ontology.
         */
        .module('classesTab', [])
        /**
         * @ngdoc directive
         * @name classesTab.directive:classesTab
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `classesTab` is a directive that creates a page containing the
         * {@link classHierarchyBlock.directive:classHierarchyBlock} of the current
         * {@link ontologyState.service:ontologyStateService selected ontology} and information about a
         * selected class from that list. The selected class display includes a
         * {@link selectedDetails.directive:selectedDetails}, a button to delete the class, an
         * {@link annotationBlock.directive:annotationBlock}, an {@link axiomBlock.directive:axiomBlock}, and a
         * {@link usagesBlock.directive:usagesBlock}. The directive houses the method for opening a modal for deleting
         * classes. The directive is replaced by the contents of its template.
         */
        .directive('classesTab', classesTab);

        classesTab.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'modalService']

        function classesTab(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/classesTab/classesTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var ontoUtils = ontologyUtilsManagerService
                    dvm.os = ontologyStateService;
                    dvm.om = ontologyManagerService;

                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', ontoUtils.deleteClass);
                    }
                }
            }
        }
})();
