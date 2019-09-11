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
     * @name ontology-editor.component:createEntityModal
     * @requires shared.service:modalService
     * @requires shared.service:ontologyStateService
     *
     * @description
     * `createEntityModal` is a component that creates content for a modal that provides buttons to create different
     * types of entities in the current {@link shared.service:ontologyStateService selected ontology}. The
     * options are {@link ontology-editor.component:createClassOverlay classes},
     * {@link ontology-editor.component:createDataPropertyOverlay data properties},
     * {@link ontology-editor.component:createObjectPropertyOverlay object properties},
     * {@link ontology-editor.component:createAnnotationPropertyOverlay annotations properties},
     * {@link ontology-editor.component:createIndividualOverlay individuals}
     * {@link ontology-editor.component:createConceptOverlay concepts} if ontology is a vocabulary, and
     * {@link ontology-editor.component:createConceptSchemeOverlay concept schemes} if ontology is a
     * vocabulary. Meant to be used in conjunction with the {@link shared.service:modalService}.
     *
     * @param {Function} dismiss A function that dismisses the modal
     */
    const createEntityModalComponent = {
        templateUrl: 'ontology-editor/components/createEntityModal/createEntityModal.component.html',
        bindings: {
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: createEntityModalComponentCtrl
    };

    createEntityModalComponentCtrl.$inject = ['modalService', 'ontologyStateService'];

    function createEntityModalComponentCtrl(modalService, ontologyStateService) {
        var dvm = this;
        dvm.os = ontologyStateService;

        dvm.createClass = function() {
            dvm.dismiss();
            modalService.openModal('createClassOverlay');
        }
        dvm.createDataProperty = function() {
            dvm.dismiss();
            modalService.openModal('createDataPropertyOverlay');
        }
        dvm.createObjectProperty = function() {
            dvm.dismiss();
            modalService.openModal('createObjectPropertyOverlay');
        }
        dvm.createAnnotationProperty = function() {
            dvm.dismiss();
            modalService.openModal('createAnnotationPropertyOverlay');
        }
        dvm.createIndividual = function() {
            dvm.dismiss();
            modalService.openModal('createIndividualOverlay');
        }
        dvm.createConcept = function() {
            dvm.dismiss();
            modalService.openModal('createConceptOverlay');
        }
        dvm.createConceptScheme = function() {
            dvm.dismiss();
            modalService.openModal('createConceptSchemeOverlay');
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }
    }

    angular.module('ontology-editor')
        .component('createEntityModal', createEntityModalComponent);
})();
