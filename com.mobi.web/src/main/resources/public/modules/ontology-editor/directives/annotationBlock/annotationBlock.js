/*-
 * #%L
 * com.mobi.web
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
        .module('annotationBlock', [])
        .directive('annotationBlock', annotationBlock);

        annotationBlock.$inject = ['ontologyStateService', 'responseObj', 'ontologyUtilsManagerService'];

        function annotationBlock(ontologyStateService, responseObj, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/annotationBlock/annotationBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ro = responseObj;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;

                    dvm.openAddOverlay = function() {
                        dvm.os.editingAnnotation = false;
                        dvm.os.annotationSelect = undefined;
                        dvm.os.annotationValue = '';
                        dvm.os.annotationType = undefined;
                        dvm.os.annotationIndex = 0;
                        dvm.os.annotationLanguage = 'en';
                        dvm.os.showAnnotationOverlay = true;
                    }

                    dvm.openRemoveOverlay = function(key, index) {
                        dvm.key = key;
                        dvm.index = index;
                        dvm.showRemoveOverlay = true;
                    }

                    dvm.editClicked = function(annotation, index) {
                        var annotationObj = dvm.os.listItem.selected[dvm.ro.getItemIri(annotation)][index];
                        dvm.os.editingAnnotation = true;
                        dvm.os.annotationSelect = annotation;
                        dvm.os.annotationValue = annotationObj['@value'];
                        dvm.os.annotationIndex = index;
                        dvm.os.annotationType = _.find(dvm.os.listItem.dataPropertyRange, datatype => dvm.ro.getItemIri(datatype) === annotationObj['@type']);
                        dvm.os.annotationLanguage = _.get(annotationObj, '@language');
                        dvm.os.showAnnotationOverlay = true;
                    }
                }
            }
        }
})();
