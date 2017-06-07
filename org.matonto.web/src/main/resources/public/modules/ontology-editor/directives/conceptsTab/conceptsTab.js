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
        .module('conceptsTab', [])
        .directive('conceptsTab', conceptsTab);

        conceptsTab.$inject = ['ontologyStateService', 'ontologyManagerService', 'responseObj'];

        function conceptsTab(ontologyStateService, ontologyManagerService, responseObj) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/conceptsTab/conceptsTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var resObj = responseObj;
                    dvm.sm = ontologyStateService;
                    dvm.om = ontologyManagerService;
                    dvm.relationshipList = [];

                    $scope.$watch('dvm.sm.selected', function(newValue) {
                        if (dvm.om.isConcept(dvm.sm.selected)
                            || _.includes(dvm.sm.listItem.concepts, resObj.createItemFromIri(_.get(dvm.sm.selected, '@id')))
                            || dvm.sm.isDerivedConcept(dvm.sm.listItem, dvm.sm.selected)) {
                            dvm.relationshipList = dvm.om.conceptRelationshipList;
                        } else if (dvm.om.isConceptScheme(dvm.sm.selected)
                            || _.includes(dvm.sm.listItem.conceptSchemes, resObj.createItemFromIri(_.get(dvm.sm.selected, '@id')))
                            || dvm.sm.isDerivedConceptScheme(dvm.sm.listItem, dvm.sm.selected)) {
                            dvm.relationshipList = dvm.om.schemeRelationshipList;
                        }
                    });
                }]
            }
        }
})();
