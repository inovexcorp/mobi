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
         * @name datatypePropertyBlock
         *
         * @description
         * The `datatypePropertyBlock` module only provides the `datatypePropertyBlock` directive which creates a
         * section for displaying the data properties on an individual.
         */
        .module('datatypePropertyBlock', [])
        /**
         * @ngdoc directive
         * @name datatypePropertyBlock.directive:datatypePropertyBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires prefixes.service:prefixes
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `datatypePropertyBlock` is a directive that creates a section that displays the data properties on the
         * {@link ontologyState.service:ontologyStateService selected individual} using
         * {@link propertyValues.directive:propertyValues}. The section header contains a button for adding a data
         * property. The directive houses the methods for opening the modal for
         * {@link datatypePropertyOverlay.directive:datatypePropertyOverlay editing, adding}, and removing data property
         * values. The directive is replaced by the contents of its template.
         */
        .directive('datatypePropertyBlock', datatypePropertyBlock);

        datatypePropertyBlock.$inject = ['ontologyStateService', 'prefixes', 'ontologyUtilsManagerService', 'modalService'];

        function datatypePropertyBlock(ontologyStateService, prefixes, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/datatypePropertyBlock/datatypePropertyBlock.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.dataProperties = _.keys(dvm.os.listItem.dataProperties.iris);

                    dvm.openAddDataPropOverlay = function() {
                        dvm.os.editingProperty = false;
                        dvm.os.propertySelect = undefined;
                        dvm.os.propertyValue = '';
                        dvm.os.propertyType = prefixes.xsd + 'string';
                        dvm.os.propertyIndex = 0;
                        dvm.os.propertyLanguage = 'en';
                        modalService.openModal('datatypePropertyOverlay');
                    }
                    dvm.editDataProp = function(property, index) {
                        var propertyObj = dvm.os.listItem.selected[property][index];
                        dvm.os.editingProperty = true;
                        dvm.os.propertySelect = property;
                        dvm.os.propertyValue = propertyObj['@value'];
                        dvm.os.propertyIndex = index;
                        dvm.os.propertyLanguage = _.get(propertyObj, '@language');
                        dvm.os.propertyType = dvm.os.propertyLanguage ? prefixes.rdf + 'langString' : _.get(propertyObj, '@type');
                        modalService.openModal('datatypePropertyOverlay');
                    }
                    dvm.showRemovePropertyOverlay = function(key, index) {
                        modalService.openConfirmModal(dvm.ontoUtils.getRemovePropOverlayMessage(key, index), () => {
                            dvm.ontoUtils.removeProperty(key, index);
                        });
                    }
                }
            }
        }
})();
