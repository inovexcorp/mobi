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
        .module('createOntologyOverlay', ['camelCase', 'ontologyManager', 'stateManager'])
        .directive('createOntologyOverlay', createOntologyOverlay);

        createOntologyOverlay.$inject = ['$filter', 'REGEX', 'ontologyManagerService', 'stateManagerService']

        function createOntologyOverlay($filter, REGEX, ontologyManagerService, stateManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createOntologyOverlay/createOntologyOverlay.html',
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    var date = new Date();
                    var prefix = 'https://matonto.org/ontologies/' + (date.getMonth() + 1) + '/' + date.getFullYear() + '/';

                    dvm.iriPattern = REGEX.IRI;
                    dvm.iriHasChanged = false;
                    dvm.iri = prefix;

                    dvm.sm = stateManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.nameChanged = function() {
                        if(!dvm.iriHasChanged) {
                            dvm.iri = prefix + $filter('camelCase')(dvm.name, 'class');
                        }
                    }

                    dvm.create = function(iri, label, description) {
                        dvm.om.createOntology(iri, label, description)
                            .then(function(response) {
                                dvm.error = '';
                                dvm.sm.showCreateOntologyOverlay = false;
                                dvm.sm.setStateToNew(dvm.sm.currentState, dvm.om.getList(), 'ontology');
                            }, function(errorMessage) {
                                dvm.error = errorMessage;
                            });
                    }
                }
            }
        }
})();
