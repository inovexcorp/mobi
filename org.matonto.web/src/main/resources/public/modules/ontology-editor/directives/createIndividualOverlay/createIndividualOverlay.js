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
        .module('createIndividualOverlay', [])
        .directive('createIndividualOverlay', createIndividualOverlay);

        createIndividualOverlay.$inject = ['$filter', 'ontologyManagerService', 'stateManagerService', 'prefixes'];

        function createIndividualOverlay($filter, ontologyManagerService, stateManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createIndividualOverlay/createIndividualOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.prefixes = prefixes;
                    dvm.om = ontologyManagerService;
                    dvm.sm = stateManagerService;

                    dvm.prefix = _.get(dvm.om.getListItemById(dvm.sm.state.ontologyId), 'iriBegin',
                        dvm.om.getOntologyIRI(dvm.sm.ontology)) + _.get(dvm.om.getListItemById(dvm.sm.state.ontologyId),
                        'iriThen', '#');

                    dvm.individual = {
                        '@id': dvm.prefix,
                        '@type': [prefixes.owl + 'NamedIndividual']
                    };

                    dvm.subClasses = _.concat(dvm.om.getClassIRIs(dvm.sm.ontology), prefixes.owl + 'NamedIndividual');

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.individual['@id'] = dvm.prefix + $filter('camelCase')(dvm.name, 'class');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.individual['@id'] = iriBegin + iriThen + iriEnd;
                    }

                    dvm.create = function() {
                        dvm.om.createIndividual(dvm.sm.state.ontologyId, dvm.individual)
                            .then(response => {
                                dvm.sm.showCreateIndividualOverlay = false;
                                dvm.sm.selectItem('individual-editor', response.entityIRI, dvm.om.getListItemById(response.ontologyId));
                                dvm.sm.setOpened(response.ontologyId, dvm.om.getOntologyIRI(response.ontologyId), true);
                            }, errorMessage => {
                                dvm.error = errorMessage;
                            });
                    }
                }
            }
        }
})();
