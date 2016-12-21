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
        .module('newOntologyTab', [])
        .directive('newOntologyTab', newOntologyTab);

        newOntologyTab.$inject = ['$filter', 'REGEX', 'ontologyManagerService', 'ontologyStateService', 'prefixes'];

        function newOntologyTab($filter, REGEX, ontologyManagerService, ontologyStateService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/newOntologyTab/newOntologyTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var date = new Date();
                    var prefix = 'https://matonto.org/ontologies/' + (date.getMonth() + 1) + '/' + date.getFullYear()
                        + '/';
                    dvm.prefixes = prefixes;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.sm = ontologyStateService;
                    dvm.om = ontologyManagerService;
                    dvm.type = 'ontology';
                    dvm.ontology = {
                        '@id': prefix,
                        '@type': [prefixes.owl + 'Ontology']
                    };

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.ontology['@id'] = prefix + $filter('camelCase')(dvm.title, 'class');
                        }
                    }

                    dvm.create = function() {
                        _.set(dvm.ontology, "['" + prefixes.dcterms + "title'][0]['@value']", dvm.title);
                        if (dvm.description) {
                            _.set(dvm.ontology, "['" + prefixes.dcterms + "description'][0]['@value']", dvm.description);
                        }
                        if (dvm.type === 'vocabulary') {
                            dvm.ontology[prefixes.owl + 'imports'] = [{
                                '@id': prefixes.skos
                            }];
                        }
                        dvm.om.createOntology(dvm.ontology, dvm.title, dvm.description, dvm.keywords, dvm.type)
                            .then(response => {
                                dvm.sm.addState(response.ontologyId, response.entityIRI, dvm.type);
                                dvm.sm.setState(response.ontologyId);
                                dvm.sm.showNewTab = false;
                            }, errorMessage => {
                                dvm.error = errorMessage;
                            });
                    }
                }
            }
        }
})();
