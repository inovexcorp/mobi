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
        .module('ontologyPropertyOverlay', [])
        .directive('ontologyPropertyOverlay', ontologyPropertyOverlay);

        ontologyPropertyOverlay.$inject = ['responseObj', 'ontologyManagerService', 'ontologyStateService', 'REGEX', 'propertyManagerService', 'utilService', 'ontologyUtilsManagerService'];

        function ontologyPropertyOverlay(responseObj, ontologyManagerService, ontologyStateService, REGEX, propertyManagerService, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyPropertyOverlay/ontologyPropertyOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.ro = responseObj;
                    dvm.os = ontologyStateService;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.pm = propertyManagerService;
                    dvm.properties = _.union(dvm.om.ontologyProperties, dvm.os.listItem.annotations);
                    dvm.util = utilService;

                    function getValue() {
                        var value = '';
                        if (dvm.isOntologyProperty()) {
                            value = dvm.os.ontologyPropertyIRI;
                        } else if (dvm.isAnnotationProperty()) {
                            value = dvm.os.ontologyPropertyValue;
                        }
                        return value;
                    }

                    function createJson(value, language) {
                        var valueObj = {};
                        if (dvm.isOntologyProperty()) {
                            valueObj = {'@id': value};
                        } else if (dvm.isAnnotationProperty()) {
                            valueObj = {'@value': value};
                        }
                        if (language) {
                            _.set(valueObj, '@language', language);
                        }
                        return dvm.util.createJson(dvm.os.listItem.selected['@id'], dvm.ro.getItemIri(dvm.os.ontologyProperty), valueObj);
                    }

                    dvm.isOntologyProperty = function() {
                        return !!dvm.os.ontologyProperty && _.some(dvm.om.ontologyProperties, property =>
                            dvm.ro.getItemIri(dvm.os.ontologyProperty) === dvm.ro.getItemIri(property));
                    }

                    dvm.isAnnotationProperty = function() {
                        return !!dvm.os.ontologyProperty && _.some(dvm.os.listItem.annotations, property =>
                            dvm.ro.getItemIri(dvm.os.ontologyProperty) === dvm.ro.getItemIri(property));
                    }

                    dvm.addProperty = function() {
                        var value = getValue();
                        dvm.pm.add(dvm.os.listItem.selected, dvm.ro.getItemIri(dvm.os.ontologyProperty), value, null, dvm.os.ontologyPropertyLanguage);
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, createJson(value, dvm.os.ontologyPropertyLanguage));
                        dvm.os.showOntologyPropertyOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                    }

                    dvm.editProperty = function() {
                        var property = dvm.ro.getItemIri(dvm.os.ontologyProperty);
                        var value = getValue();
                        var oldObj = _.get(dvm.os.listItem.selected, "['" + property + "']['" + dvm.os.ontologyPropertyIndex + "']");
                        dvm.os.addToDeletions(dvm.os.listItem.ontologyRecord.recordId, createJson(_.get(oldObj, '@value', _.get(oldObj, '@id')), _.get(oldObj, '@language')));
                        dvm.pm.edit(dvm.os.listItem.selected, property, value, dvm.os.ontologyPropertyIndex, null, dvm.os.ontologyPropertyLanguage);
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, createJson(value, dvm.os.ontologyPropertyLanguage));
                        dvm.os.showOntologyPropertyOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                    }
                }
            }
        }
})();
