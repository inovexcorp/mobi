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
        .module('axiomOverlay', [])
        .directive('axiomOverlay', axiomOverlay);

        axiomOverlay.$inject = ['responseObj', 'ontologyManagerService', 'stateManagerService'];

        function axiomOverlay(responseObj, ontologyManagerService, stateManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/axiomOverlay/axiomOverlay.html',
                scope: {
                    axiomList: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.ro = responseObj;
                    dvm.sm = stateManagerService;

                    function closeAndMark() {
                        dvm.sm.setUnsaved(dvm.sm.listItem.ontologyId, dvm.sm.selected.matonto.originalIRI, true);
                        dvm.sm.showAxiomOverlay = false;
                    }

                    dvm.addAxiom = function() {
                        var values = [];
                        _.forEach(dvm.values, value => values.push({'@id': dvm.ro.getItemIri(value)}));
                        var axiom = dvm.ro.getItemIri(dvm.axiom);
                        if (_.has(dvm.sm.selected, axiom)) {
                            dvm.sm.selected[axiom] = _.union(dvm.sm.selected[axiom], values);
                        } else {
                            dvm.sm.selected[axiom] = values;
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
