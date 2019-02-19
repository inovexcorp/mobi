/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
         * @name objectPropertyOverlay
         *
         * @description
         * The `objectPropertyOverlay` module only provides the `objectPropertyOverlay` directive which creates
         * content for a modal to add an object property to an individual.
         */
        .module('objectPropertyOverlay', [])
        /**
         * @ngdoc directive
         * @name objectPropertyOverlay.directive:objectPropertyOverlay
         * @scope
         * @restrict E
         * @requires shared.service:ontologyStateService
         * @requires shared.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires shared.service:propertyManagerService
         *
         * @description
         * `objectPropertyOverlay` is a directive that creates content for a modal that adds an object property value to
         * the {@link shared.service:ontologyStateService selected individual}. The form in the modal contains a
         * `ui-select` of all the object properties in the ontology and an {@link iriSelect.directive:iriSelect} of all
         * the valid individuals for the object property value based on the range of the selected property. Meant to
         * be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('objectPropertyOverlay', objectPropertyOverlay);

        objectPropertyOverlay.$inject = ['ontologyStateService', 'utilService', 'ontologyUtilsManagerService', 'propertyManagerService'];

        function objectPropertyOverlay(ontologyStateService, utilService, ontologyUtilsManagerService, propertyManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/objectPropertyOverlay/objectPropertyOverlay.directive.html',
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
                    dvm.individuals = angular.copy(dvm.os.listItem.individuals.iris);
                    delete dvm.individuals[dvm.os.getActiveEntityIRI()];

                    dvm.addProperty = function(select, value) {
                        var valueObj = {'@id': value};
                        var added = pm.addId(dvm.os.listItem.selected, select, value);
                        if (added) {
                            dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.util.createJson(dvm.os.listItem.selected['@id'], select, valueObj));
                            dvm.ontoUtils.saveCurrentChanges();
                        } else {
                            dvm.util.createWarningToast('Duplicate property values not allowed');
                        }
                        var types = dvm.os.listItem.selected['@type'];
                        if (dvm.ontoUtils.containsDerivedConcept(types) || dvm.ontoUtils.containsDerivedConceptScheme(types)) {
                            dvm.ontoUtils.updateVocabularyHierarchies(select, [valueObj]);
                        }
                        $scope.close();
                    }
                    dvm.getValues = function(searchText) {
                        dvm.values = dvm.ontoUtils.getSelectList(_.keys(dvm.os.listItem.objectProperties.iris), searchText, dvm.ontoUtils.getDropDownText);
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();
