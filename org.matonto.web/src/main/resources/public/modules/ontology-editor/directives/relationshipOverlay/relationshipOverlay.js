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
        .module('relationshipOverlay', [])
        .directive('relationshipOverlay', relationshipOverlay);

        relationshipOverlay.$inject = ['$filter', 'responseObj', 'ontologyManagerService', 'stateManagerService'];

        function relationshipOverlay($filter, responseObj, ontologyManagerService, stateManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/relationshipOverlay/relationshipOverlay.html',
                scope: {
                    relationshipList: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.ro = responseObj;
                    dvm.sm = stateManagerService;
                    dvm.concepts = [];
                    dvm.conceptList = dvm.om.getConceptIRIs(dvm.sm.ontology);
                    dvm.schemeList = dvm.om.getConceptSchemeIRIs(dvm.sm.ontology);

                    function closeAndMark() {
                        dvm.sm.setUnsaved(dvm.sm.listItem.ontologyId, dvm.sm.selected.matonto.originalIRI, true);
                        dvm.sm.showRelationshipOverlay = false;
                    }

                    dvm.addRelationship = function() {
                        var axiom = dvm.ro.getItemIri(dvm.relationship);
                        if (_.has(dvm.sm.selected, axiom)) {
                            dvm.sm.selected[axiom] = _.union(dvm.sm.selected[axiom], dvm.values);
                        } else {
                            dvm.sm.selected[axiom] = dvm.values;
                        }
                        closeAndMark();
                    }

                    dvm.getIRINamespace = function(item) {
                        var split = $filter('splitIRI')(item);
                        return split.begin + split.then;
                    }

                    dvm.getItemNamespace = function(item) {
                        return _.get(item, 'namespace', 'No namespace');
                    }
                }
            }
        }
})();
