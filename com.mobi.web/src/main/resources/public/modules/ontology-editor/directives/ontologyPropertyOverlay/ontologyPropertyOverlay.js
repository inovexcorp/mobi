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
        .module('ontologyPropertyOverlay', [])
        .directive('ontologyPropertyOverlay', ontologyPropertyOverlay);

        ontologyPropertyOverlay.$inject = ['ontologyStateService', 'REGEX', 'propertyManagerService', 'utilService', 'ontologyUtilsManagerService'];

        function ontologyPropertyOverlay(ontologyStateService, REGEX, propertyManagerService, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyPropertyOverlay/ontologyPropertyOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var pm = propertyManagerService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.util = utilService;
                    dvm.properties = _.union(pm.ontologyProperties, _.keys(dvm.os.listItem.annotations.iris));

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
                        return dvm.util.createJson(dvm.os.listItem.selected['@id'], dvm.os.ontologyProperty, valueObj);
                    }

                    dvm.isOntologyProperty = function() {
                        return !!dvm.os.ontologyProperty && _.some(pm.ontologyProperties, property => dvm.os.ontologyProperty === property);
                    }

                    dvm.isAnnotationProperty = function() {
                        return !!dvm.os.ontologyProperty && _.has(dvm.os.listItem.annotations.iris, dvm.os.ontologyProperty);
                    }

                    dvm.addProperty = function() {
                        var value = getValue();
                        pm.add(dvm.os.listItem.selected, dvm.os.ontologyProperty, value, null, dvm.os.ontologyPropertyLanguage);
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, createJson(value, dvm.os.ontologyPropertyLanguage));
                        dvm.os.showOntologyPropertyOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                    }

                    dvm.editProperty = function() {
                        var value = getValue();
                        var oldObj = _.get(dvm.os.listItem.selected, "['" + dvm.os.ontologyProperty + "']['" + dvm.os.ontologyPropertyIndex + "']");
                        dvm.os.addToDeletions(dvm.os.listItem.ontologyRecord.recordId, createJson(_.get(oldObj, '@value', _.get(oldObj, '@id')), _.get(oldObj, '@language')));
                        pm.edit(dvm.os.listItem.selected, dvm.os.ontologyProperty, value, dvm.os.ontologyPropertyIndex, null, dvm.os.ontologyPropertyLanguage);
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, createJson(value, dvm.os.ontologyPropertyLanguage));
                        dvm.os.showOntologyPropertyOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                    }
                }
            }
        }
})();
