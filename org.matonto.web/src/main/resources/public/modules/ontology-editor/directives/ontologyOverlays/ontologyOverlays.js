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

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }

                    dvm.save = function() {
                        dvm.om.saveChanges(dvm.sm.state.ontologyId, dvm.sm.getUnsavedEntities(dvm.sm.ontology),
                            dvm.sm.getCreatedEntities(dvm.sm.ontology), dvm.sm.state.deletedEntities)
                            .then(newId => {
                                dvm.sm.afterSave(newId);
                                dvm.sm.showSaveOverlay = false;
                            }, onError);
                    }

                    dvm.removeAnnotation = function() {
                        dvm.am.remove(dvm.sm.selected, dvm.sm.key, dvm.sm.index);
                        dvm.sm.setUnsaved(dvm.sm.ontology, dvm.sm.selected.matonto.originalIRI, true);
                        dvm.sm.showRemoveOverlay = false;
                    }

                    dvm.removeIndividualProperty = function() {
                        _.pullAt(dvm.sm.selected[dvm.sm.key], dvm.sm.index);
                        if (!dvm.sm.selected[dvm.sm.key].length) {
                            _.unset(dvm.sm.selected, dvm.sm.key);
                        }
                        dvm.sm.setUnsaved(dvm.sm.state.ontology, dvm.sm.state.entityIRI, true);
                        dvm.sm.showRemoveIndividualPropertyOverlay = false;
                    }
                }
            }
        }
})();
