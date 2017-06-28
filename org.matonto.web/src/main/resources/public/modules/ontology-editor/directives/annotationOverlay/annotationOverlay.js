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

        annotationOverlay.$inject = ['responseObj', 'propertyManagerService', 'ontologyStateService', 'utilService', 'ontologyUtilsManagerService', 'prefixes'];

        function annotationOverlay(responseObj, propertyManagerService, ontologyStateService, utilService, ontologyUtilsManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/annotationOverlay/annotationOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.pm = propertyManagerService;
                    dvm.ro = responseObj;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.prefixes = prefixes;

                    function createJson(value, type, language) {
                        var valueObj = {'@value': value};
                        if (type) {
                            _.set(valueObj, '@type', type);
                        }
                        if (language) {
                            _.set(valueObj, '@language', language);
                        }
                        return dvm.util.createJson(dvm.os.listItem.selected['@id'], dvm.ro.getItemIri(dvm.os.annotationSelect), valueObj);
                    }

                    dvm.disableProp = function(annotation) {
                        return dvm.ro.getItemIri(annotation) === prefixes.owl + 'deprecated' && _.has(dvm.os.listItem.selected, "['" + prefixes.owl + 'deprecated' + "']");
                    }
                    dvm.selectProp = function() {
                        dvm.os.annotationValue = '';
                        if (dvm.ro.getItemIri(dvm.os.annotationSelect) === prefixes.owl + 'deprecated') {
                            dvm.os.annotationType = {namespace: prefixes.xsd, localName: 'boolean'};
                            dvm.os.annotationLanguage = '';
                        } else {
                            dvm.os.annotationType = undefined;
                            dvm.os.annotationLanguage = 'en';
                        }
                    }
                    dvm.addAnnotation = function() {
                        var property = dvm.ro.getItemIri(dvm.os.annotationSelect);
                        var annotationType = dvm.ro.getItemIri(dvm.os.annotationType);
                        dvm.pm.add(dvm.os.listItem.selected, property, dvm.os.annotationValue, annotationType, dvm.os.annotationLanguage);
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, createJson(dvm.os.annotationValue, annotationType, dvm.os.annotationLanguage));
                        dvm.os.showAnnotationOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                        dvm.ontoUtils.updateLabel();
                    }
                    dvm.editAnnotation = function() {
                        var property = dvm.ro.getItemIri(dvm.os.annotationSelect);
                        var annotationType = dvm.ro.getItemIri(dvm.os.annotationType);
                        var oldObj = _.get(dvm.os.listItem.selected, "['" + property + "']['" + dvm.os.annotationIndex + "']");
                        dvm.os.addToDeletions(dvm.os.listItem.ontologyRecord.recordId, createJson(_.get(oldObj, '@value'), _.get(oldObj, '@type'), _.get(oldObj, '@language')));
                        dvm.pm.edit(dvm.os.listItem.selected, property, dvm.os.annotationValue, dvm.os.annotationIndex, annotationType, dvm.os.annotationLanguage);
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, createJson(dvm.os.annotationValue, annotationType, dvm.os.annotationLanguage));
                        dvm.os.showAnnotationOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                        dvm.ontoUtils.updateLabel();
                    }
                }
            }
        }
})();
