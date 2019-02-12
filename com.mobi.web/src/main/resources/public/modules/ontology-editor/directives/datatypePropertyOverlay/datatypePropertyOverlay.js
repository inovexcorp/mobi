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
        /**
         * @ngdoc overview
         * @name datatypePropertyOverlay
         *
         * @description
         * The `datatypePropertyOverlay` module only provides the `datatypePropertyOverlay` directive which creates
         * content for a modal to add a data property to an individual.
         */
        .module('datatypePropertyOverlay', [])
        .config(['$qProvider', function($qProvider) {
            $qProvider.errorOnUnhandledRejections(false);
        }])
        /**
         * @ngdoc directive
         * @name datatypePropertyOverlay.directive:datatypePropertyOverlay
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires propertyManager.service:propertyManagerService
         *
         * @description
         * `datatypePropertyOverlay` is a directive that creates content for a modal that adds a data property value to
         * the {@link ontologyState.service:ontologyStateService selected individual}. The form in the modal contains a
         * `ui-select` of all the data properties in the ontology, a {@link textArea.directive:textArea} for the data
         * property value, an {@link iriSelect.directive:iriSelect} for the datatype, and a
         * {@link languageSelect.directive:languageSelect}. Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('datatypePropertyOverlay', datatypePropertyOverlay);

        datatypePropertyOverlay.$inject = ['ontologyStateService', 'utilService', 'prefixes', 'ontologyUtilsManagerService', 'propertyManagerService'];

        function datatypePropertyOverlay(ontologyStateService, utilService, prefixes, ontologyUtilsManagerService, propertyManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/datatypePropertyOverlay/datatypePropertyOverlay.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var pm = propertyManagerService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.dataProperties = _.keys(dvm.os.listItem.dataProperties.iris);

                    dvm.isDisabled = function() {
                        var isDisabled = dvm.propertyForm.$invalid || !dvm.os.propertyValue;
                        if (!dvm.os.editingProperty) {
                            isDisabled = isDisabled || dvm.os.propertySelect === undefined;
                        }
                        return isDisabled;
                    }
                    dvm.submit = function(select, value, type, language) {
                        if (dvm.os.editingProperty) {
                            dvm.editProperty(select, value, type, language);
                        } else {
                            dvm.addProperty(select, value, type, language);
                        }
                    }
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
                        $scope.close();
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
                        $scope.close();
                    }
                    dvm.isLangString = function() {
                        return prefixes.rdf + 'langString' === dvm.os.propertyType;
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }

                    function getType(language, type) {
                        return language ? '' : type || prefixes.xsd + 'string';
                    }
                    function getLang(language) {
                        return language && dvm.isLangString() ? language : '';
                    }
                }]
            }
        }
})();
