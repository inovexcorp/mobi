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

        datatypePropertyOverlay.$inject = ['responseObj', 'ontologyManagerService', 'ontologyStateService',
            'utilService', 'prefixes'];

        function datatypePropertyOverlay(responseObj, ontologyManagerService, ontologyStateService, utilService, prefixes) {
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
                    dvm.util = utilService;

                    dvm.addProperty = function(select, value, type, language) {
                        var property = dvm.ro.getItemIri(select);
                        if (property) {
                            var valueObj = {'@value': value};
                            if (language && dvm.isStringType()) {
                                valueObj['@language'] = language;
                            } else if (type) {
                                valueObj['@type'] = type['@id'];
                            }
                            if (_.has(dvm.sm.selected, property)) {
                                dvm.sm.selected[property].push(valueObj);
                            } else {
                                dvm.sm.selected[property] = [valueObj];
                            }
                        }
                        dvm.om.addToAdditions(dvm.sm.listItem.recordId, dvm.util.createJson(dvm.sm.selected['@id'],
                            property, valueObj));
                        dvm.sm.showDataPropertyOverlay = false;
                    }

                    dvm.editProperty = function(select, value, type, language) {
                        var property = dvm.ro.getItemIri(select);
                        if (property) {
                            var propertyObj = dvm.sm.selected[property][dvm.sm.propertyIndex];
                            dvm.om.addToDeletions(dvm.sm.listItem.recordId, dvm.util.createJson(dvm.sm.selected['@id'],
                                property, propertyObj));
                            propertyObj['@value'] = value;
                            if (type && !(language && dvm.isStringType())) {
                                propertyObj['@type'] = type['@id'];
                            } else {
                                _.unset(propertyObj, '@type');
                            }
                            if (language && dvm.isStringType()) {
                                propertyObj['@language'] = language;
                            } else {
                                _.unset(propertyObj, '@language');
                            }
                            dvm.om.addToAdditions(dvm.sm.listItem.recordId, dvm.util.createJson(dvm.sm.selected['@id'],
                                property, propertyObj));
                        }
                        dvm.sm.showDataPropertyOverlay = false;
                    }

                    dvm.isStringType = function() {
                        return prefixes.rdf + 'langString' === _.get(dvm.sm.propertyType, '@id', '');
                    }
                }
            }
        }
})();
