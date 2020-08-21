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
import { get } from 'lodash';

const template = require('./datatypePropertyBlock.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:datatypePropertyBlock
 * @requires shared.service:ontologyStateService
 * @requires shared.service:prefixes
 * @requires ontology-editor.service:ontologyUtilsManagerService
 * @requires shared.service:modalService
 *
 * @description
 * `datatypePropertyBlock` is a component that creates a section that displays the data properties on the
 * {@link shared.service:ontologyStateService selected individual} using
 * {@link ontology-editor.component:propertyValues}. The section header contains a button for adding a data
 * property. The component houses the methods for opening the modal for
 * {@link ontology-editor.component:datatypePropertyOverlay editing, adding}, and removing data property
 * values. T
 */
const datatypePropertyBlockComponent = {
    template,
    bindings: {
        selected:'<'
    },
    controllerAs: 'dvm',
    controller: datatypePropertyBlockComponentCtrl
};

datatypePropertyBlockComponentCtrl.$inject = ['$filter', 'ontologyStateService', 'prefixes', 'ontologyUtilsManagerService', 'modalService'];

function datatypePropertyBlockComponentCtrl($filter, ontologyStateService, prefixes, ontologyUtilsManagerService, modalService) {
    var dvm = this;
    dvm.os = ontologyStateService;
    dvm.ontoUtils = ontologyUtilsManagerService;
    dvm.dataProperties = [];
    dvm.dataPropertiesFiltered = [];

    dvm.$onInit = function() {
        dvm.updatePropertiesFiltered();
    }
    dvm.updatePropertiesFiltered = function(){
        console.log('datatypePropertyBlockComponentCtrl - updatePropertiesFiltered');
        dvm.dataProperties = Object.keys(dvm.os.listItem.dataProperties.iris);
        dvm.dataPropertiesFiltered = $filter("orderBy")($filter("showProperties")(dvm.selected, dvm.dataProperties), dvm.ontoUtils.getLabelForIRI);
    }
    dvm.$onChanges = function (changes) { 
        // console.log(changes);
        // TODO need to do something here? 
    }
    dvm.openAddDataPropOverlay = function() {
        dvm.os.editingProperty = false;
        dvm.os.propertySelect = undefined;
        dvm.os.propertyValue = '';
        dvm.os.propertyType = prefixes.xsd + 'string';
        dvm.os.propertyIndex = 0;
        dvm.os.propertyLanguage = 'en';
        modalService.openModal('datatypePropertyOverlay',{} ,dvm.updatePropertiesFiltered);
    }
    dvm.editDataProp = function(property, index) {
        var propertyObj = dvm.os.listItem.selected[property][index];
        dvm.os.editingProperty = true;
        dvm.os.propertySelect = property;
        dvm.os.propertyValue = propertyObj['@value'];
        dvm.os.propertyIndex = index;
        dvm.os.propertyLanguage = get(propertyObj, '@language');
        dvm.os.propertyType = dvm.os.propertyLanguage ? prefixes.rdf + 'langString' : get(propertyObj, '@type');
        modalService.openModal('datatypePropertyOverlay',{} ,dvm.updatePropertiesFiltered);
    }
    dvm.showRemovePropertyOverlay = function(key, index) {
        modalService.openConfirmModal(dvm.ontoUtils.getRemovePropOverlayMessage(key, index), () => {
            dvm.ontoUtils.removeProperty(key, index);
            dvm.updatePropertiesFiltered();
        });
    }
}

export default datatypePropertyBlockComponent;