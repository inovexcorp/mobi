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
        .module('objectPropertyOverlay', [])
        .directive('objectPropertyOverlay', objectPropertyOverlay);

        objectPropertyOverlay.$inject = ['$filter', 'responseObj', 'ontologyStateService', 'utilService', 'ontologyUtilsManagerService'];

        function objectPropertyOverlay($filter, responseObj, ontologyStateService, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/objectPropertyOverlay/objectPropertyOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.ro = responseObj;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.individuals = $filter('removeIriFromArray')(dvm.os.listItem.individuals.iris, dvm.os.getActiveEntityIRI());
                    dvm.valueSelect = _.find(dvm.individuals, individual => dvm.ro.getItemIri(individual) === dvm.os.propertyValue);

                    dvm.addProperty = function(select, value) {
                        var property = dvm.ro.getItemIri(select);
                        if (property) {
                            if (_.has(dvm.os.listItem.selected, property)) {
                                dvm.os.listItem.selected[property].push(value);
                            } else {
                                dvm.os.listItem.selected[property] = [value];
                            }
                        }
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.util.createJson(dvm.os.listItem.selected['@id'], property, value));
                        dvm.os.showObjectPropertyOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                    }

                    dvm.editProperty = function(select, value) {
                        var property = dvm.ro.getItemIri(select);
                        if (property) {
                            dvm.os.addToDeletions(dvm.os.listItem.ontologyRecord.recordId, dvm.util.createJson(dvm.os.listItem.selected['@id'], property, dvm.os.listItem.selected[property][dvm.os.propertyIndex]));
                            dvm.os.listItem.selected[property][dvm.os.propertyIndex] = value;
                            dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.util.createJson(dvm.os.listItem.selected['@id'], property, value));
                        }
                        dvm.os.showObjectPropertyOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                    }
                }
            }
        }
})();
