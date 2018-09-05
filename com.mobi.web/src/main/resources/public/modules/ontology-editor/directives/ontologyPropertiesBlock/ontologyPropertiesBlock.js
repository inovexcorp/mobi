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
        .module('ontologyPropertiesBlock', [])
        .directive('ontologyPropertiesBlock', ontologyPropertiesBlock);

        ontologyPropertiesBlock.$inject = ['ontologyStateService', 'propertyManagerService', 'ontologyUtilsManagerService', 'modalService'];

        function ontologyPropertiesBlock(ontologyStateService, propertyManagerService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyPropertiesBlock/ontologyPropertiesBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var pm = propertyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.properties = _.union(pm.ontologyProperties, _.keys(dvm.os.listItem.annotations.iris));

                    dvm.openAddOverlay = function() {
                        dvm.os.editingOntologyProperty = false;
                        dvm.os.ontologyProperty = undefined;
                        dvm.os.ontologyPropertyIRI = '';
                        dvm.os.ontologyPropertyValue = '';
                        dvm.os.ontologyPropertyType = undefined;
                        dvm.os.ontologyPropertyLanguage = '';
                        modalService.openModal('ontologyPropertyOverlay');
                    }
                    dvm.openRemoveOverlay = function(key, index) {
                        modalService.openConfirmModal(dvm.ontoUtils.getRemovePropOverlayMessage(key, index), () => {
                            dvm.ontoUtils.removeProperty(key, index);
                        });
                    }
                    dvm.editClicked = function(property, index) {
                        var propertyObj = dvm.os.listItem.selected[property][index];
                        dvm.os.editingOntologyProperty = true;
                        dvm.os.ontologyProperty = property;
                        dvm.os.ontologyPropertyIRI = _.get(propertyObj, '@id');
                        dvm.os.ontologyPropertyValue = _.get(propertyObj, '@value');
                        dvm.os.ontologyPropertyType = _.get(propertyObj, '@type');
                        dvm.os.ontologyPropertyIndex = index;
                        dvm.os.ontologyPropertyLanguage = _.get(propertyObj, '@language');
                        modalService.openModal('ontologyPropertyOverlay');
                    }

                    $scope.$watch('dvm.os.listItem.selected', () => {
                        dvm.properties = _.union(pm.ontologyProperties, _.keys(dvm.os.listItem.annotations.iris));
                    });
                }]
            }
        }
})();
