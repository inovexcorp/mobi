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
        .module('ontologySideBar', [])
        .directive('ontologySideBar', ontologySideBar);

        ontologySideBar.$inject = ['stateManagerService', 'ontologyManagerService'];

        function ontologySideBar(stateManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/ontologySideBar/ontologySideBar.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.sm = stateManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.shouldSaveBeEnabled = function() {
                        return dvm.sm.hasUnsavedEntities(dvm.sm.ontology) && !dvm.sm.hasInvalidEntities(dvm.sm.ontology);
                    }

                    dvm.closeOntology = function() {
                        if (dvm.shouldSaveBeEnabled()) {
                            dvm.sm.showCloseOverlay = true;
                        } else {
                            dvm.om.closeOntology(dvm.sm.state.ontologyId);
                            dvm.sm.clearState(dvm.sm.state.ontologyId);
                        }
                    }
                }
            }
        }
})();
