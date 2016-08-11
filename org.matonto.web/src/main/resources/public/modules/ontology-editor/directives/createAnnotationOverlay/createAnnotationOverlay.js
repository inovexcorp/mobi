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
        .module('createAnnotationOverlay', [])
        .directive('createAnnotationOverlay', createAnnotationOverlay);

        createAnnotationOverlay.$inject = ['REGEX', 'annotationManagerService', 'stateManagerService',
            'ontologyManagerService'];

        function createAnnotationOverlay(REGEX, annotationManagerService, stateManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createAnnotationOverlay/createAnnotationOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.iriPattern = REGEX.IRI;
                    dvm.am = annotationManagerService;
                    dvm.sm = stateManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.create = function() {
                        dvm.am.create(dvm.sm.state.ontologyId, dvm.om.getAnnotationIRIs(dvm.sm.ontology), dvm.iri)
                            .then(annotationJSON => {
                                _.set(annotationJSON, 'matonto.originalIRI', angular.copy(annotationJSON['@id']));
                                dvm.om.addEntity(dvm.sm.state.ontologyId, annotationJSON);
                                dvm.sm.showCreateAnnotationOverlay = false;
                            }, errorMessage => {
                                dvm.error = errorMessage;
                            });
                    }
                }
            }
        }
})();
