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
        .module('propertyEditor', ['stateManager', 'ontologyManager', 'prefixes'])
        .directive('propertyEditor', propertyEditor);

        propertyEditor.$inject = ['stateManagerService', 'ontologyManagerService', 'prefixes'];

        function propertyEditor(stateManagerService, ontologyManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/propertyEditor/propertyEditor.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.sm = stateManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.prefixes = prefixes;
                    dvm.propertyTypes = dvm.om.getPropertyTypes();

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.om.editIRI(iriBegin, iriThen, iriEnd, dvm.sm.selected, dvm.sm.ontology);
                        dvm.om.entityChanged(dvm.sm.selected, dvm.sm.ontology.matonto.id, dvm.sm.currentState);
                    }
                }
            }
        }
})();
