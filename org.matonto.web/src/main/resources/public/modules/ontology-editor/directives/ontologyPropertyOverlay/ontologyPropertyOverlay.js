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

        ontologyPropertyOverlay.$inject = ['responseObj', 'ontologyManagerService', 'stateManagerService', 'REGEX',
            'annotationManagerService'];

        function ontologyPropertyOverlay(responseObj, ontologyManagerService, stateManagerService, REGEX, annotationManagerService) {
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
                    dvm.sm = stateManagerService;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.am = annotationManagerService;
                    dvm.ontologyProperties = angular.copy(dvm.om.ontologyProperties);
                    dvm.annotations = angular.copy(dvm.sm.listItem.annotations);
                    dvm.properties = _.union(dvm.ontologyProperties, dvm.annotations);

                    function markAndClose() {
                        dvm.sm.setUnsaved(dvm.sm.ontology, dvm.sm.selected.matonto.originalIRI, true);
                        dvm.sm.showOntologyPropertyOverlay = false;
                    }

                    function getValue() {
                        var value = '';
                        if (dvm.isOntologyProperty()) {
                            value = dvm.sm.ontologyPropertyIRI;
                        } else if (dvm.isAnnotationProperty()) {
                            value = dvm.sm.ontologyPropertyValue;
                        }
                        return value;
                    }

                    dvm.isDisabled = function() {
                        var valid = true;
                        if (dvm.isAnnotationProperty()) {
                            valid = !!dvm.sm.ontologyPropertyValue;
                        }
                        return dvm.propertyForm.$invalid || !dvm.sm.ontologyProperty || !valid;
                    }

                    dvm.isOntologyProperty = function() {
                        return !!dvm.sm.ontologyProperty && _.some(dvm.ontologyProperties, property =>
                            _.isEqual(dvm.ro.getItemIri(dvm.sm.ontologyProperty), dvm.ro.getItemIri(property)));
                    }

                    dvm.isAnnotationProperty = function() {
                        return !!dvm.sm.ontologyProperty && _.some(dvm.annotations, property =>
                            _.isEqual(dvm.ro.getItemIri(dvm.sm.ontologyProperty), dvm.ro.getItemIri(property)));
                    }

                    dvm.addProperty = function() {
                        dvm.am.add(dvm.sm.selected, dvm.ro.getItemIri(dvm.sm.ontologyProperty), getValue());
                        markAndClose();
                    }

                    dvm.editProperty = function() {
                        dvm.am.edit(dvm.sm.selected, dvm.ro.getItemIri(dvm.sm.ontologyProperty), getValue(),
                            dvm.sm.ontologyPropertyIndex);
                        markAndClose();
                    }

                    dvm.getItemNamespace = function(item) {
                        return _.get(item, 'namespace', 'No namespace');
                    }
                }
            }
        }
})();
