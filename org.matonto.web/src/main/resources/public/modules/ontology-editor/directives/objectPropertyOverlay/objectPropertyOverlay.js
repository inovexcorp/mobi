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
        .module('objectPropertyOverlay', [])
        .directive('objectPropertyOverlay', objectPropertyOverlay);

        objectPropertyOverlay.$inject = ['$filter', 'responseObj', 'ontologyManagerService', 'stateManagerService'];

        function objectPropertyOverlay($filter, responseObj, ontologyManagerService, stateManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/objectPropertyOverlay/objectPropertyOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.om = ontologyManagerService;
                    dvm.ro = responseObj;
                    dvm.sm = stateManagerService;

                    dvm.individuals = $filter('removeIriFromArray')(dvm.sm.state.individuals, dvm.sm.state.entityIRI);
                    dvm.valueSelect = _.find(dvm.individuals, individual => dvm.ro.getItemIri(individual) === dvm.sm.propertyValue);

                    function closeAndMark() {
                        dvm.sm.setUnsaved(dvm.sm.state.ontology, dvm.sm.state.entityIRI, true);
                        dvm.sm.showObjectPropertyOverlay = false;
                    }

                    dvm.addProperty = function(select, value) {
                        var property = dvm.ro.getItemIri(select);
                        if (property) {
                            if (_.has(dvm.sm.selected, property)) {
                                dvm.sm.selected[property].push(value);
                            } else {
                                dvm.sm.selected[property] = [value];
                            }
                        }
                        closeAndMark();
                    }

                    dvm.editProperty = function(select, value) {
                        var property = dvm.ro.getItemIri(select);
                        if (property) {
                            dvm.sm.selected[property][dvm.sm.propertyIndex] = value;
                        }
                        closeAndMark();
                    }

                    dvm.getItemNamespace = function(item) {
                        return _.get(item, 'namespace', 'No namespace');
                    }
                }
            }
        }
})();
