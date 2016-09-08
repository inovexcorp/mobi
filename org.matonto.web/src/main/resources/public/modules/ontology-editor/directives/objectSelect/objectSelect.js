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
        .module('objectSelect', [])
        .directive('objectSelect', objectSelect);

        objectSelect.$inject = ['ontologyManagerService', 'responseObj', 'settingsManagerService',
            'stateManagerService', 'prefixes'];

        function objectSelect(ontologyManagerService, responseObj, settingsManagerService, stateManagerService,
            prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/objectSelect/objectSelect.html',
                scope: {
                    displayText: '=',
                    selectList: '=',
                    mutedText: '=',
                    isDisabledWhen: '=',
                    isRequiredWhen: '=',
                    multiSelect: '=',
                    removeModel: '=',
                    onChange: '&'
                },
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    $scope.multiSelect = angular.isDefined($scope.multiSelect) ? $scope.multiSelect : true;

                    dvm.sm = stateManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.tooltipDisplay = settingsManagerService.getTooltipDisplay();

                    dvm.getItemOntologyIri = function(item) {
                        return _.get(item, 'ontologyId', dvm.sm.state.ontologyId);
                    }

                    dvm.getItemIri = function(item) {
                        return _.get(item, '@id', responseObj.getItemIri(item));
                    }

                    dvm.getTooltipDisplay = function(item) {
                        var itemIri = dvm.getItemIri(item);
                        var result = itemIri;
                        if (!_.has(item, 'ontologyId')) {
                            var selectedObject = dvm.om.getEntity(dvm.sm.ontology, itemIri);
                            if (dvm.tooltipDisplay === 'comment') {
                                result = dvm.om.getEntityDescription(selectedObject) || itemIri;
                            } else if (dvm.tooltipDisplay === 'label') {
                                result = dvm.om.getEntityName(selectedObject) || itemIri;
                            } else if (_.has(selectedObject, '@id')) {
                                result = selectedObject['@id'];
                            }
                        }
                        return result;
                    }

                    dvm.isBlankNode = function(id) {
                        return typeof id === 'string' && _.includes(id, '_:b');
                    }

                    dvm.getBlankNodeValue = function(id) {
                        var result;
                        if (dvm.isBlankNode(id)) {
                            result = _.get(dvm.sm.state.blankNodes, id, id);
                        }
                        return result;
                    }
                }]
            }
        }
})();
