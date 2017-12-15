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
        .module('objectSelect', [])
        .directive('objectSelect', objectSelect);

        objectSelect.$inject = ['ontologyManagerService', 'settingsManagerService', 'ontologyStateService', 'ontologyUtilsManagerService'];

        function objectSelect(ontologyManagerService, settingsManagerService, ontologyStateService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/objectSelect/objectSelect.html',
                scope: {
                    displayText: '<',
                    mutedText: '<',
                    isDisabledWhen: '<',
                    isRequiredWhen: '<',
                    multiSelect: '<?',
                    onChange: '&'
                },
                bindToController: {
                    bindModel: '=ngModel',
                    selectList: '<'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var os = ontologyStateService;
                    var om = ontologyManagerService;
                    $scope.multiSelect = angular.isDefined($scope.multiSelect) ? $scope.multiSelect : true;

                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.tooltipDisplay = settingsManagerService.getTooltipDisplay();
                    dvm.values = [];

                    dvm.getOntologyIri = function(iri) {
                        return _.get(dvm.selectList, "['" + iri + "']", os.listItem.ontologyId);
                    }
                    dvm.getTooltipDisplay = function(iri) {
                        var result = iri;
                        if (dvm.getOntologyIri(iri) === os.listItem.ontologyId) {
                            var selectedObject = os.getEntityByRecordId(os.listItem.ontologyRecord.recordId, iri);
                            if (dvm.tooltipDisplay === 'comment') {
                                result = om.getEntityDescription(selectedObject) || iri;
                            } else if (dvm.tooltipDisplay === 'label') {
                                result = om.getEntityName(selectedObject) || iri;
                            } else if (_.has(selectedObject, '@id')) {
                                result = selectedObject['@id'];
                            }
                        }
                        return result;
                    }
                    dvm.getValues = function(searchText) {
                        dvm.values = dvm.ontoUtils.getSelectList(_.keys(dvm.selectList), searchText, dvm.ontoUtils.getDropDownText);
                    }
                }]
            }
        }
})();
