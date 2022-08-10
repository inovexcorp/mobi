/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import { OntologyStateService } from '../../../shared/services/ontologyState.service';

const template = require('./datatypePropertyBlock.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:datatypePropertyBlock
 * @requires shared.service:ontologyStateService
 * @requires shared.service:prefixes
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

datatypePropertyBlockComponentCtrl.$inject = ['$filter', 'ontologyStateService', 'prefixes', 'modalService'];

function datatypePropertyBlockComponentCtrl($filter, ontologyStateService: OntologyStateService, prefixes, modalService) {
    var dvm = this;
    dvm.os = ontologyStateService;
    dvm.dataProperties = [];
    dvm.dataPropertiesFiltered = [];

    dvm.$onChanges = function (changes) { 
        dvm.updatePropertiesFiltered();
    }
    dvm.updatePropertiesFiltered = function(){
        dvm.dataProperties = Object.keys(dvm.os.listItem.dataProperties.iris);
        dvm.dataPropertiesFiltered = $filter('orderBy')($filter('showProperties')(dvm.os.listItem.selected, dvm.dataProperties), iri => dvm.os.getEntityNameByListItem(iri));
    }
    dvm.openAddDataPropOverlay = function() {
        dvm.os.editingProperty = false;
        dvm.os.propertySelect = undefined;
        dvm.os.propertyValue = '';
        dvm.os.propertyType = prefixes.xsd + 'string';
        dvm.os.propertyIndex = 0;
        dvm.os.propertyLanguage = 'en';
        modalService.openModal('datatypePropertyOverlay' ,{} ,dvm.updatePropertiesFiltered);
    }
    dvm.editDataProp = function(property, index) {
        var propertyObj = dvm.os.listItem.selected[property][index];
        dvm.os.editingProperty = true;
        dvm.os.propertySelect = property;
        dvm.os.propertyValue = propertyObj['@value'];
        dvm.os.propertyIndex = index;
        dvm.os.propertyLanguage = get(propertyObj, '@language');
        dvm.os.propertyType = dvm.os.propertyLanguage ? prefixes.rdf + 'langString' : get(propertyObj, '@type');
        modalService.openModal('datatypePropertyOverlay', {}, dvm.updatePropertiesFiltered);
    }
    dvm.showRemovePropertyOverlay = function(key, index) {
        modalService.openConfirmModal(dvm.os.getRemovePropOverlayMessage(key, index), () => {
            dvm.os.removeProperty(key, index).subscribe();
            dvm.updatePropertiesFiltered();
        });
    }
}

export default datatypePropertyBlockComponent;
