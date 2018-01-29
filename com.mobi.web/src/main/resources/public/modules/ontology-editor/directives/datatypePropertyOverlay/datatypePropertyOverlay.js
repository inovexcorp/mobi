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

        datatypePropertyOverlay.$inject = ['ontologyStateService', 'utilService', 'prefixes', 'ontologyUtilsManagerService', 'propertyManagerService'];

        function datatypePropertyOverlay(ontologyStateService, utilService, prefixes, ontologyUtilsManagerService, propertyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/datatypePropertyOverlay/datatypePropertyOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var pm = propertyManagerService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.dataProperties = _.keys(dvm.os.listItem.dataProperties.iris);

                    dvm.addProperty = function(select, value, type, language) {
                        var lang = getLang(language);
                        var realType = getType(lang, type);
                        var added = pm.addValue(dvm.os.listItem.selected, select, value, realType, lang);
                        if (added) {
                            dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.util.createJson(dvm.os.listItem.selected['@id'], select, pm.createValueObj(value, realType, lang)));
                            dvm.ontoUtils.saveCurrentChanges();
                        } else {
                            dvm.util.createWarningToast('Duplicate property values not allowed');
                        }
                        dvm.os.showDataPropertyOverlay = false;
                    }
                    dvm.editProperty = function(select, value, type, language) {
                        var oldObj = angular.copy(dvm.os.listItem.selected[select][dvm.os.propertyIndex]);
                        var lang = getLang(language);
                        var realType = getType(lang, type);
                        var edited = pm.editValue(dvm.os.listItem.selected, select, dvm.os.propertyIndex, value, realType, lang);
                        if (edited) {
                            dvm.os.addToDeletions(dvm.os.listItem.ontologyRecord.recordId, dvm.util.createJson(dvm.os.listItem.selected['@id'], select, oldObj));
                            dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.util.createJson(dvm.os.listItem.selected['@id'], select, pm.createValueObj(value, realType, lang)));
                            dvm.ontoUtils.saveCurrentChanges();
                        } else {
                            dvm.util.createWarningToast('Duplicate property values not allowed');
                        }
                        dvm.os.showDataPropertyOverlay = false;
                    }

                    dvm.isLangString = function() {
                        return prefixes.rdf + 'langString' === dvm.os.propertyType;
                    }
                    function getType(language, type) {
                        return language ? '' : type || prefixes.xsd + 'string';
                    }
                    function getLang(language) {
                        return language && dvm.isLangString() ? language : '';
                    }
                }
            }
        }
})();
