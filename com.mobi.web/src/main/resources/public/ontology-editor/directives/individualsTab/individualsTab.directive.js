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
         * @name individualsTab
         *
         * @description
         * The `individualsTab` module only provides the `individualsTab` directive which creates a page for viewing the
         * individuals in an ontology.
         */
        .module('individualsTab', [])
        /**
         * @ngdoc directive
         * @name individualsTab.directive:individualsTab
         * @scope
         * @restrict E
         * @requires shared.service:ontologyStateService
         * @requires shared.service:ontologyManagerService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires shared.service:modalService
         *
         * @description
         * `individualsTab` is a directive that creates a page containing the
         * {@link individualHierarchyBlock.directive:individualHierarchyBlock} of the current
         * {@link shared.service:ontologyStateService selected ontology} and information about a selected
         * individual from that list. The selected individual display includes a
         * {@link selectedDetails.directive:selectedDetails}, a button to delete the individual, a
         * {@link datatypePropertyBlock.directive:datatypePropertyBlock}, a
         * {@link objectPropertyBlock.directive:objectPropertyBlock}, and a {@link usagesBlock.directive:usagesBlock}.
         * The directive houses the method for opening a modal for deleting individuals. The directive is replaced by
         * the contents of its template.
         */
        .directive('individualsTab', individualsTab);

        individualsTab.$inject = ['ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService', 'modalService']

        function individualsTab(ontologyStateService, ontologyManagerService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/individualsTab/individualsTab.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;
                    dvm.om = ontologyManagerService;

                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', ontoUtils.deleteIndividual);
                    }
                    dvm.seeHistory = function() {
                        dvm.os.listItem.seeHistory = true;
                    }
                }
            }
        }
})();
