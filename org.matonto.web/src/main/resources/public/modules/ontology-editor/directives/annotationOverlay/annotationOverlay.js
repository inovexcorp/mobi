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
        .module('annotationOverlay', [])
        .directive('annotationOverlay', annotationOverlay);

        annotationOverlay.$inject = ['responseObj', 'ontologyManagerService', 'annotationManagerService', 'stateManagerService'];

        function annotationOverlay(responseObj, ontologyManagerService, annotationManagerService, stateManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/annotationOverlay/annotationOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.am = annotationManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.ro = responseObj;
                    dvm.sm = stateManagerService;

                    function closeAndMark() {
                        dvm.sm.showAnnotationOverlay = false;
                        dvm.sm.entityChanged(dvm.sm.selected, dvm.sm.ontology.matonto.id, dvm.sm.getState());
                    }

                    dvm.addAnnotation = function(select, value) {
                        dvm.am.add(dvm.sm.selected, dvm.ro.getItemIri(select), value);
                        closeAndMark();
                    }

                    dvm.editAnnotation = function(select, value) {
                        dvm.am.edit(dvm.sm.selected, dvm.ro.getItemIri(select), value, dvm.sm.annotationIndex);
                        closeAndMark();
                    }
                }
            }
        }
})();
