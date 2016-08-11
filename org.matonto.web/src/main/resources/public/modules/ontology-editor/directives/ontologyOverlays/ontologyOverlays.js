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
        .module('ontologyOverlays', [])
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

                    function selectCurrentOntology() {
                        dvm.sm.selectItem('ontology-editor', dvm.om.getOntologyIRI(dvm.sm.ontology),
                            dvm.om.getListItemById(dvm.sm.state.ontologyId));
                        dvm.sm.showDeleteConfirmation = false;
                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }

                    dvm.deleteEntity = function() {
                        if (dvm.om.isOntology(dvm.sm.selected)) {
                            dvm.om.deleteOntology(dvm.sm.state.ontologyId)
                                .then(() => {
                                    dvm.sm.clearState(dvm.sm.state.ontologyId);
                                    dvm.sm.showDeleteConfirmation = false;
                                }, onError);
                        } else if (dvm.om.isClass(dvm.sm.selected)) {
                            dvm.om.deleteClass(dvm.sm.state.ontologyId, dvm.sm.state.entityIRI)
                                .then(selectCurrentOntology, onError);
                        } else if (dvm.om.isObjectProperty(dvm.sm.selected)) {
                            dvm.om.deleteObjectProperty(dvm.sm.state.ontologyId, dvm.sm.state.entityIRI)
                                .then(selectCurrentOntology, onError);
                        } else if (dvm.om.isDataTypeProperty(dvm.sm.selected)) {
                            dvm.om.deleteDataTypeProperty(dvm.sm.state.ontologyId, dvm.sm.state.entityIRI)
                                .then(selectCurrentOntology, onError);
                        } else if (dvm.om.isIndividual(dvm.sm.selected)) {
                            dvm.om.deleteIndividual(dvm.sm.state.ontologyId, dvm.sm.state.entityIRI)
                                .then(selectCurrentOntology, onError);
                        }
                    }

                    dvm.save = function() {
                        dvm.om.saveChanges(dvm.sm.state.ontologyId, dvm.sm.getUnsavedEntities(dvm.sm.ontology))
                            .then(newId => {
                                dvm.sm.afterSave(newId);
                                dvm.sm.showSaveOverlay = false;
                            }, onError);
                    }

                    dvm.removeAnnotation = function() {
                        dvm.am.remove(dvm.sm.selected, dvm.sm.key, dvm.sm.index);
                        dvm.sm.setUnsaved(dvm.sm.state.ontologyId, dvm.sm.state.entityIRI, true);
                        dvm.sm.showRemoveAnnotationOverlay = false;
                    }
                }
            }
        }
})();
