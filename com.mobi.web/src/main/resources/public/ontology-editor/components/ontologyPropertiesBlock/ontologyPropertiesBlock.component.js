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

    /**
     * @ngdoc component
     * @name ontology-editor.component:ontologyPropertiesBlock
     * @requires shared.service:ontologyStateService
     * @requires shared.service:propertyManagerService
     * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
     * @requires shared.service:modalService
     *
     * @description
     * `ontologyPropertiesBlock` is a component that creates a section that displays the ontology properties (and
     * annotations) on the provided ontology using {@link ontology-editor.component:propertyValues}. The section header
     * contains a button for adding a property. The component houses the methods for opening the modal for
     * {@link ontology-editor.component:ontologyPropertyOverlay editing, adding}, and removing ontology properties.
     * 
     * @param {Object} ontology A JSON-LD object representing an ontology 
     */
    const ontologyPropertiesBlockComponent = {
        templateUrl: 'ontology-editor/components/ontologyPropertiesBlock/ontologyPropertiesBlock.component.html',
        bindings: {
            ontology: '<'
        },
        controllerAs: 'dvm',
        controller: ontologyPropertiesBlockComponentCtrl
    };

    ontologyPropertiesBlockComponentCtrl.$inject = ['ontologyStateService', 'propertyManagerService', 'ontologyUtilsManagerService', 'modalService'];

    function ontologyPropertiesBlockComponentCtrl(ontologyStateService, propertyManagerService, ontologyUtilsManagerService, modalService) {
        var dvm = this;
        var pm = propertyManagerService;
        dvm.os = ontologyStateService;
        dvm.ontoUtils = ontologyUtilsManagerService;
        dvm.properties = [];
        
        dvm.$onChanges = function() {
            dvm.properties = _.union(pm.ontologyProperties, pm.defaultAnnotations, pm.owlAnnotations, _.keys(dvm.os.listItem.annotations.iris));
        }
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
            var propertyObj = dvm.ontology[property][index];
            dvm.os.editingOntologyProperty = true;
            dvm.os.ontologyProperty = property;
            dvm.os.ontologyPropertyIRI = _.get(propertyObj, '@id');
            dvm.os.ontologyPropertyValue = _.get(propertyObj, '@value');
            dvm.os.ontologyPropertyType = _.get(propertyObj, '@type');
            dvm.os.ontologyPropertyIndex = index;
            dvm.os.ontologyPropertyLanguage = _.get(propertyObj, '@language');
            modalService.openModal('ontologyPropertyOverlay');
        }
    }

    angular.module('ontology-editor')
        .component('ontologyPropertiesBlock', ontologyPropertiesBlockComponent);
})();
