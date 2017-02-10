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

        ontologyPropertyOverlay.$inject = ['responseObj', 'ontologyManagerService', 'ontologyStateService', 'REGEX',
            'propertyManagerService', 'utilService'];

        function ontologyPropertyOverlay(responseObj, ontologyManagerService, ontologyStateService, REGEX,
            propertyManagerService, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyPropertyOverlay/ontologyPropertyOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.ro = responseObj;
                    dvm.sm = ontologyStateService;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.pm = propertyManagerService;
                    dvm.properties = _.union(dvm.om.ontologyProperties, dvm.sm.listItem.annotations);
                    dvm.util = utilService;

                    function getValue() {
                        var value = '';
                        if (dvm.isOntologyProperty()) {
                            value = dvm.sm.ontologyPropertyIRI;
                        } else if (dvm.isAnnotationProperty()) {
                            value = dvm.sm.ontologyPropertyValue;
                        }
                        return value;
                    }

                    function createJson(value) {
                        return utilService.createJson(dvm.sm.selected['@id'],
                            dvm.ro.getItemIri(dvm.sm.ontologyProperty), value);
                    }

                    dvm.isOntologyProperty = function() {
                        return !!dvm.sm.ontologyProperty && _.some(dvm.om.ontologyProperties, property =>
                            dvm.ro.getItemIri(dvm.sm.ontologyProperty) === dvm.ro.getItemIri(property));
                    }

                    dvm.isAnnotationProperty = function() {
                        return !!dvm.sm.ontologyProperty && _.some(dvm.sm.listItem.annotations, property =>
                            dvm.ro.getItemIri(dvm.sm.ontologyProperty) === dvm.ro.getItemIri(property));
                    }

                    dvm.addProperty = function() {
                        var value = getValue();
                        dvm.pm.add(dvm.sm.selected, dvm.ro.getItemIri(dvm.sm.ontologyProperty), value);
                        dvm.om.addToAdditions(dvm.sm.listItem.recordId, createJson(value));
                        dvm.sm.showOntologyPropertyOverlay = false;
                    }

                    dvm.editProperty = function() {
                        var property = dvm.ro.getItemIri(dvm.sm.ontologyProperty);
                        var value = getValue();
                        var oldValue = _.get(dvm.sm.selected, "['" + property + "']['" + dvm.sm.ontologyPropertyIndex
                            + "']['@value']");
                        dvm.om.addToDeletions(dvm.sm.listItem.recordId, createJson(oldValue));
                        dvm.pm.edit(dvm.sm.selected, property, value, dvm.sm.ontologyPropertyIndex);
                        dvm.om.addToAdditions(dvm.sm.listItem.recordId, createJson(value));
                        dvm.sm.showOntologyPropertyOverlay = false;
                    }
                }
            }
        }
})();
