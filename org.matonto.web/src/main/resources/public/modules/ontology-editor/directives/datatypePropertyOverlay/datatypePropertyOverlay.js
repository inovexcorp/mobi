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
        .module('datatypePropertyOverlay', [])
        .directive('datatypePropertyOverlay', datatypePropertyOverlay);

        datatypePropertyOverlay.$inject = ['responseObj', 'ontologyManagerService', 'ontologyStateService'];

        function datatypePropertyOverlay(responseObj, ontologyManagerService, ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/datatypePropertyOverlay/datatypePropertyOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.ro = responseObj;
                    dvm.sm = ontologyStateService;

                    function closeAndMark() {
                        dvm.sm.setUnsaved(dvm.sm.ontology, dvm.sm.getActiveEntityIRI(), true);
                        dvm.sm.showDataPropertyOverlay = false;
                    }

                    dvm.addProperty = function(select, value, type) {
                        var property = dvm.ro.getItemIri(select);
                        if (property) {
                            var valueObj = {'@value': value};
                            if (type) {
                                valueObj['@type'] = type['@id'];
                            }
                            if (_.has(dvm.sm.selected, property)) {
                                dvm.sm.selected[property].push(valueObj);
                            } else {
                                dvm.sm.selected[property] = [valueObj];
                            }
                        }
                        closeAndMark();
                    }

                    dvm.editProperty = function(select, value, type) {
                        var property = dvm.ro.getItemIri(select);
                        if (property) {
                            dvm.sm.selected[property][dvm.sm.propertyIndex]['@value'] = value;
                        }
                        if (_.get(type, '@id') !== dvm.sm.selected[property][dvm.sm.propertyIndex]['@type']) {
                            if (type) {
                                dvm.sm.selected[property][dvm.sm.propertyIndex]['@type'] = type['@id'];
                            } else {
                                _.unset(dvm.sm.selected[property][dvm.sm.propertyIndex], '@type');
                            }
                        }
                        closeAndMark();
                    }

                    dvm.getItemNamespace = function(item) {
                        return _.get(item, 'namespace', 'No namespace');
                    }
                }
            }
        }
})();
