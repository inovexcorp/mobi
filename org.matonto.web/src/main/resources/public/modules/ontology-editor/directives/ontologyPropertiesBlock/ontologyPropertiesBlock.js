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
        .module('ontologyPropertiesBlock', [])
        .directive('ontologyPropertiesBlock', ontologyPropertiesBlock);

        ontologyPropertiesBlock.$inject = ['ontologyStateService', 'ontologyManagerService', 'responseObj'];

        function ontologyPropertiesBlock(ontologyStateService, ontologyManagerService, responseObj) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyPropertiesBlock/ontologyPropertiesBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ro = responseObj;
                    dvm.sm = ontologyStateService;
                    dvm.om = ontologyManagerService;
                    dvm.properties = _.union(dvm.om.ontologyProperties, dvm.sm.listItem.annotations);

                    dvm.openAddOverlay = function() {
                        dvm.sm.editingOntologyProperty = false;
                        dvm.sm.ontologyProperty = undefined;
                        dvm.sm.ontologyPropertyIRI = '';
                        dvm.sm.ontologyPropertyValue = '';
                        // dvm.sm.ontologyPropertyType = undefined;
                        dvm.sm.ontologyPropertyLanguage = 'en';
                        dvm.sm.showOntologyPropertyOverlay = true;
                    }

                    dvm.openRemoveOverlay = function(key, index) {
                        dvm.key = key;
                        dvm.index = index;
                        dvm.showRemoveOverlay = true;
                    }

                    dvm.editClicked = function(property, index) {
                        var propertyObj = dvm.sm.selected[dvm.ro.getItemIri(property)][index];
                        dvm.sm.editingOntologyProperty = true;
                        dvm.sm.ontologyProperty = property;
                        dvm.sm.ontologyPropertyIRI = _.get(propertyObj, '@id');
                        dvm.sm.ontologyPropertyValue = _.get(propertyObj, '@value');
                        // dvm.sm.ontologyPropertyType = _.get(dvm.sm.selected[dvm.ro.getItemIri(property)][index], '@type');
                        dvm.sm.ontologyPropertyIndex = index;
                        dvm.sm.ontologyPropertyLanguage = _.get(propertyObj, '@language', undefined);
                        dvm.sm.showOntologyPropertyOverlay = true;
                    }
                }
            }
        }
})();
