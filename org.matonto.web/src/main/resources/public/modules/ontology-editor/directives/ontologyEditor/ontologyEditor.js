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
        .module('ontologyEditor', ['stateManager', 'ontologyManager'])
        .directive('ontologyEditor', ontologyEditor);

        ontologyEditor.$inject = ['REGEX', 'stateManagerService', 'ontologyManagerService'];

        function ontologyEditor(REGEX, stateManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyEditor/ontologyEditor.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.iriPattern = REGEX.IRI;
                    dvm.om = ontologyManagerService;
                    dvm.sm = stateManagerService;

                    dvm.getPreview = function(serialization) {
                        dvm.om.getPreview(dvm.sm.ontology.matonto.id, serialization)
                            .then(function(response) {
                                dvm.preview = response;
                            }, function(response) {
                                dvm.preview = response;
                            });
                    }

                    dvm.iriChanged = function(isValid) {
                        dvm.sm.ontology.matonto.isValid = isValid;
                        dvm.om.entityChanged(dvm.sm.selected, dvm.sm.ontology.matonto.id, dvm.sm.currentState);
                    }
                }
            }
        }
})();
