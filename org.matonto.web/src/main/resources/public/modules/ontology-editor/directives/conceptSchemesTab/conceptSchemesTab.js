/*-
 * #%L
 * org.matonto.web
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
        .module('conceptSchemesTab', [])
        .directive('conceptSchemesTab', conceptSchemesTab);

        conceptSchemesTab.$inject = ['ontologyStateService', 'ontologyManagerService'];

        function conceptSchemesTab(ontologyStateService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/conceptSchemesTab/conceptSchemesTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.sm = ontologyStateService;
                    dvm.om = ontologyManagerService;
                    dvm.relationshipList = [];

                    $scope.$watch('dvm.sm.listItem.selected', function(newValue) {
                        if (dvm.om.isConcept(dvm.sm.listItem.selected, dvm.sm.listItem.derivedConcepts)) {
                            dvm.relationshipList = dvm.om.conceptRelationshipList;
                        } else if (dvm.om.isConceptScheme(dvm.sm.listItem.selected, dvm.sm.listItem.derivedConceptSchemes)) {
                            dvm.relationshipList = dvm.om.schemeRelationshipList;
                        }
                    });
                }]
            }
        }
})();
