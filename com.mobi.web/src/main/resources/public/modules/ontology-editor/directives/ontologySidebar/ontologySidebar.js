/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
         * @name ontologySidebar
         *
         * @description
         * The `ontologySidebar` module provides the `ontologySidebar` directive which creates a `div`
         * with the sidebar of the Ontology Editor.
         */
        .module('ontologySidebar', [])
        /**
         * @ngdoc directive
         * @name ontologySidebar.directive:ontologySidebar
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `ontologySidebar` is a directive that creates a `div` containing a button to
         * {@link ontologyDefaultTab.directive:ontologyDefaultTab open ontologies} and a `nav` of the
         * {@link ontologyState.service:ontologyStateService opened ontologies}. The currently selected
         * {@link ontologyState.service:ontologyStateService listItem} will have a
         * {@link ontologyBranchSelect.directive:ontologyBranchSelect} displayed underneath. The directive is
         * replaced by the contents of its template.
         */
        .directive('ontologySidebar', ontologySidebar);

        ontologySidebar.$inject = ['ontologyManagerService', 'ontologyStateService'];

        function ontologySidebar(ontologyManagerService, ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologySidebar/ontologySidebar.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;

                    dvm.onClose = function(listItem) {
                        if (dvm.os.hasChanges(listItem)) {
                            dvm.os.recordIdToClose = listItem.ontologyRecord.recordId;
                            dvm.os.showCloseOverlay = true;
                        } else {
                            dvm.os.closeOntology(listItem.ontologyRecord.recordId);
                        }
                    }
                    dvm.onClick = function(listItem) {
                        var previousListItem = dvm.os.listItem;
                        if (previousListItem) {
                            previousListItem.active = false;
                        }
                        if (listItem && !_.isEmpty(listItem)) {
                            listItem.active = true;
                            dvm.os.listItem = listItem;
                        } else {
                            dvm.os.listItem = {};
                        }
                    }
                }
            }
        }
})();
