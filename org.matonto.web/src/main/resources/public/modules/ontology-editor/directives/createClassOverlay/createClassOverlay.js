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
        .module('createClassOverlay', [])
        .directive('createClassOverlay', createClassOverlay);

        createClassOverlay.$inject = ['$filter', 'REGEX', 'ontologyManagerService', 'stateManagerService'];

        function createClassOverlay($filter, REGEX, ontologyManagerService, stateManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createClassOverlay/createClassOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.iriPattern = REGEX.IRI;
                    dvm.om = ontologyManagerService;
                    dvm.sm = stateManagerService;

                    dvm.prefix = _.get(dvm.sm.ontology, 'matonto.iriBegin', '') + _.get(dvm.sm.ontology, 'matonto.iriThen', '');
                    dvm.iri = dvm.prefix;

                    dvm.nameChanged = function() {
                        if(!dvm.iriHasChanged) {
                            dvm.iri = dvm.prefix + $filter('camelCase')(dvm.name, 'class');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.iri = iriBegin + iriThen + iriEnd;
                    }

                    dvm.create = function() {
                        dvm.om.createClass(dvm.sm.ontology, dvm.iri, dvm.name, dvm.description)
                            .then(function(response) {
                                dvm.error = '';
                                dvm.sm.showCreateClassOverlay = false;
                                dvm.sm.setStateToNew(dvm.sm.state, dvm.om.getList(), 'class');
                            }, function(errorMessage) {
                                dvm.error = errorMessage;
                            });
                    }
                }
            }
        }
})();
