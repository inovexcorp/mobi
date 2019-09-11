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
     * @name ontology-editor.component:objectPropertyBlock
     * @requires shared.service:ontologyStateService
     * @requires ontology-editor.service:ontologyUtilsManagerService
     * @requires shared.service:modalService
     *
     * @description
     * `objectPropertyBlock` is a component that creates a section that displays the object properties on the
     * {@link shared.service:ontologyStateService selected individual} using
     * {@link ontology-editor.component:propertyValues}. The section header contains a button for adding an object
     * property. The component houses the methods for opening the modal for
     * {@link ontology-editor.component:objectPropertyOverlay adding} and removing object property values.
     */
    const objectPropertyBlockComponent = {
        templateUrl: 'ontology-editor/components/objectPropertyBlock/objectPropertyBlock.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: objectPropertyBlockComponentCtrl
    };

    objectPropertyBlockComponentCtrl.$inject = ['ontologyStateService', 'ontologyUtilsManagerService', 'modalService'];

    function objectPropertyBlockComponentCtrl(ontologyStateService, ontologyUtilsManagerService, modalService) {
        var dvm = this;
        dvm.os = ontologyStateService;
        dvm.ontoUtils = ontologyUtilsManagerService;
        dvm.objectProperties = _.keys(dvm.os.listItem.objectProperties.iris);

        dvm.openAddObjectPropOverlay = function() {
            dvm.os.editingProperty = false;
            dvm.os.propertySelect = undefined;
            dvm.os.propertyValue = '';
            dvm.os.propertyIndex = 0;
            modalService.openModal('objectPropertyOverlay');
        }
        dvm.showRemovePropertyOverlay = function(key, index) {
            dvm.key = key;
            modalService.openConfirmModal(dvm.ontoUtils.getRemovePropOverlayMessage(key, index), () => {
                dvm.ontoUtils.removeProperty(key, index).then(dvm.removeObjectProperty);
            });
        }
        dvm.removeObjectProperty = function(axiomObject) {
            var types = dvm.os.listItem.selected['@type'];
            if (dvm.ontoUtils.containsDerivedConcept(types) || dvm.ontoUtils.containsDerivedConceptScheme(types)) {
                dvm.ontoUtils.removeFromVocabularyHierarchies(dvm.key, axiomObject);
            }
        }
    }

    angular.module('ontology-editor')        
        .component('objectPropertyBlock', objectPropertyBlockComponent);
})();
