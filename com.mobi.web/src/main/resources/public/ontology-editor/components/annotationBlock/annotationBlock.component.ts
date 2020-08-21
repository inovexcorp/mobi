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
import { get, union } from 'lodash';

import './annotationBlock.component.scss';

const template = require('./annotationBlock.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:annotationBlock
 * @requires shared.service:ontologyStateService
 * @requires ontology-editor.service:ontologyUtilsManagerService
 * @requires shared.service:propertyManagerService
 * @requires shared.service:modalService
 *
 * @description
 * `annotationBlock` is a component that creates a section that displays the annotations on the
 * {@link shared.service:ontologyStateService selected entity} using
 * {@link ontology-editor.component:propertyValues}. The section header contains a button for adding an
 * annotation. The component houses the methods for opening the modal for
 * {@link ontology-editor.component:annotationOverlay editing, adding}, and removing annotations.
 */
const annotationBlockComponent = {
    template,
    bindings: {
        highlightIris: '<',
        highlightText: '<',
        selected:'<'
    },
    controllerAs: 'dvm',
    controller: annotationBlockComponentCtrl
};

annotationBlockComponentCtrl.$inject = ['$filter', 'ontologyStateService', 'ontologyUtilsManagerService', 'propertyManagerService', 'modalService'];

function annotationBlockComponentCtrl($filter, ontologyStateService, ontologyUtilsManagerService, propertyManagerService, modalService) {
    var dvm = this;
    var pm = propertyManagerService;
    dvm.os = ontologyStateService;
    dvm.ontoUtils = ontologyUtilsManagerService;
    dvm.annotations = [];
    dvm.annotationsFiltered = [];
    dvm.initialized = false;

    dvm.$onInit = function() {
        dvm.updatePropertiesFiltered();
        dvm.initialized = true;
    }
    dvm.$onChanges = function (changes) { 
        if(dvm.initialized){
            dvm.updatePropertiesFiltered();
        }
    }
    dvm.updatePropertiesFiltered = function(){
        dvm.annotations = union(Object.keys(dvm.os.listItem.annotations.iris), pm.defaultAnnotations, pm.owlAnnotations);
        dvm.annotationsFiltered = $filter("orderBy")($filter("showProperties")(dvm.selected, dvm.annotations), dvm.ontoUtils.getLabelForIRI);
    }
    dvm.openAddOverlay = function() {
        dvm.os.editingAnnotation = false;
        dvm.os.annotationSelect = undefined;
        dvm.os.annotationValue = '';
        dvm.os.annotationType = undefined;
        dvm.os.annotationIndex = 0;
        dvm.os.annotationLanguage = 'en';
        modalService.openModal('annotationOverlay', {}, dvm.updatePropertiesFiltered);
    }
    dvm.openRemoveOverlay = function(key, index) {
        modalService.openConfirmModal(dvm.ontoUtils.getRemovePropOverlayMessage(key, index), () => {
            dvm.ontoUtils.removeProperty(key, index);
            dvm.updatePropertiesFiltered();
        });
    }
    dvm.editClicked = function(annotation, index) {
        var annotationObj = dvm.os.listItem.selected[annotation][index];
        dvm.os.editingAnnotation = true;
        dvm.os.annotationSelect = annotation;
        dvm.os.annotationValue = annotationObj['@value'];
        dvm.os.annotationIndex = index;
        dvm.os.annotationType = get(annotationObj, '@type');
        dvm.os.annotationLanguage = get(annotationObj, '@language');
        modalService.openModal('annotationOverlay', {}, dvm.updatePropertiesFiltered);
    }
}

export default annotationBlockComponent;