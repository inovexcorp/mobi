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
        .module('ontologyOverlays', ['stateManager', 'ontologyManager', 'annotationManager'])
        .directive('ontologyOverlays', ontologyOverlays);

        ontologyOverlays.$inject = ['stateManagerService', 'ontologyManagerService', 'annotationManagerService'];

        function ontologyOverlays(stateManagerService, ontologyManagerService, annotationManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/ontologyOverlays/ontologyOverlays.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.sm = stateManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.am = annotationManagerService;

                    dvm.deleteEntity = function() {
                        dvm.om.delete(dvm.sm.ontology.matonto.id, dvm.sm.selected.matonto.originalIri, dvm.sm.state)
                            .then(function(response) {
                                dvm.error = '';
                                dvm.sm.showDeleteConfirmation = false;
                                if(response.selectOntology) {
                                    dvm.sm.setTreeTab('everything');
                                    dvm.sm.selectItem('ontology-editor', dvm.sm.state.oi);
                                } else {
                                    dvm.sm.clearState(dvm.sm.state.oi);
                                }
                            }, function(errorMessage) {
                                dvm.error = errorMessage;
                            });
                    }

                    dvm.save = function() {
                        dvm.om.edit(dvm.sm.ontology.matonto.id, dvm.sm.state)
                            .then(function(state) {
                                dvm.sm.showSaveOverlay = false;
                                dvm.sm.state = state;
                            });
                    }

                    dvm.removeAnnotation = function() {
                        dvm.am.remove(dvm.sm.selected, dvm.sm.key, dvm.sm.index);
                        dvm.sm.entityChanged(dvm.sm.selected, dvm.sm.ontology.matonto.id, dvm.sm.state);
                        dvm.sm.showRemoveAnnotationOverlay = false;
                    }
                }
            }
        }
})();
