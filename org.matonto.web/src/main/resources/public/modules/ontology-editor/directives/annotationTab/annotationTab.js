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
        .module('annotationTab', ['stateManager', 'responseObj'])
        .directive('annotationTab', annotationTab);

        annotationTab.$inject = ['stateManagerService', 'responseObj'];

        function annotationTab(stateManagerService, responseObj) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/annotationTab/annotationTab.html',
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.ro = responseObj;
                    dvm.sm = stateManagerService;

                    dvm.openAddOverlay = function() {
                        dvm.sm.editingAnnotation = false;
                        dvm.sm.annotationSelect = undefined;
                        dvm.sm.annotationValue = '';
                        dvm.sm.annotationIndex = 0;
                        dvm.sm.showAnnotationOverlay = true;
                    }

                    dvm.openRemoveOverlay = function(key, index) {
                        dvm.sm.key = key;
                        dvm.sm.index = index;
                        dvm.sm.showRemoveAnnotationOverlay = true;
                    }

                    dvm.editClicked = function(annotation, index) {
                        dvm.sm.editingAnnotation = true;
                        dvm.sm.annotationSelect = annotation;
                        dvm.sm.annotationValue = dvm.sm.selected[dvm.ro.getItemIri(annotation)][index]['@value'];
                        dvm.sm.annotationIndex = index;
                        dvm.sm.showAnnotationOverlay = true;
                    }
                }
            }
        }
})();
