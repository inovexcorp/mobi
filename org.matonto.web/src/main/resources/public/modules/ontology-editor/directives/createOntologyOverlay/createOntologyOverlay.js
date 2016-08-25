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
        .module('createOntologyOverlay', [])
        .directive('createOntologyOverlay', createOntologyOverlay);

        createOntologyOverlay.$inject = ['$filter', 'REGEX', 'ontologyManagerService', 'stateManagerService',
            'prefixes'];

        function createOntologyOverlay($filter, REGEX, ontologyManagerService, stateManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createOntologyOverlay/createOntologyOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    var date = new Date();
                    var prefix = 'https://matonto.org/ontologies/' + (date.getMonth() + 1) + '/' + date.getFullYear()
                        + '/';

                    dvm.prefixes = prefixes;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.sm = stateManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.ontology = {
                        '@id': prefix,
                        '@type': [prefixes.owl + 'Ontology'],
                        [prefixes.dcterms + 'title']: [{
                            '@value': ''
                        }],
                        [prefixes.dcterms + 'description']: [{
                            '@value': ''
                        }]
                    };

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.ontology['@id'] = prefix + $filter('camelCase')(
                                dvm.ontology[prefixes.dcterms + 'title'][0]['@value'], 'class');
                        }
                    }

                    dvm.create = function() {
                        if (dvm.ontology[prefixes.dcterms + 'description'][0]['@value'] === '') {
                            _.unset(dvm.ontology, prefixes.dcterms + 'description');
                        }
                        dvm.om.createOntology(dvm.ontology)
                            .then(response => {
                                dvm.sm.showCreateOntologyOverlay = false;
                                dvm.sm.selectItem('ontology-editor', response.entityIRI,
                                    dvm.om.getListItemById(response.ontologyId));
                            }, errorMessage => {
                                dvm.error = errorMessage;
                            });
                    }
                }
            }
        }
})();
