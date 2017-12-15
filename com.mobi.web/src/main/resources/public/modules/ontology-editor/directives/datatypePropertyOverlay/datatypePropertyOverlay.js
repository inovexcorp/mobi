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
        .module('datatypePropertyOverlay', [])
        .directive('datatypePropertyOverlay', datatypePropertyOverlay);

        datatypePropertyOverlay.$inject = ['ontologyStateService', 'utilService', 'prefixes', 'ontologyUtilsManagerService'];

        function datatypePropertyOverlay(ontologyStateService, utilService, prefixes, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/datatypePropertyOverlay/datatypePropertyOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.dataProperties = _.keys(dvm.os.listItem.dataProperties.iris);

                    dvm.addProperty = function(select, value, type, language) {
                        if (select) {
                            var valueObj = {'@value': value};
                            if (language && dvm.isStringType()) {
                                valueObj['@language'] = language;
                            } else if (type) {
                                valueObj['@type'] = type['@id'];
                            }
                            if (_.has(dvm.os.listItem.selected, select)) {
                                dvm.os.listItem.selected[select].push(valueObj);
                            } else {
                                dvm.os.listItem.selected[select] = [valueObj];
                            }
                        }
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.util.createJson(dvm.os.listItem.selected['@id'], select, valueObj));
                        dvm.os.showDataPropertyOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                    }

                    dvm.editProperty = function(select, value, type, language) {
                        if (select) {
                            var propertyObj = dvm.os.listItem.selected[select][dvm.os.propertyIndex];
                            dvm.os.addToDeletions(dvm.os.listItem.ontologyRecord.recordId, dvm.util.createJson(dvm.os.listItem.selected['@id'], select, propertyObj));
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
                            dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.util.createJson(dvm.os.listItem.selected['@id'], select, propertyObj));
                        }
                        dvm.os.showDataPropertyOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                    }

                    dvm.isStringType = function() {
                        return prefixes.rdf + 'langString' === _.get(dvm.os.propertyType, '@id', '');
                    }
                }
            }
        }
})();
