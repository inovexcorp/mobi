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
import { union, get } from 'lodash';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';

const template = require('./ontologyPropertiesBlock.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:ontologyPropertiesBlock
 * @requires shared.service:ontologyStateService
 * @requires shared.service:propertyManagerService
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
    template,
    bindings: {
        ontology: '<'
    },
    controllerAs: 'dvm',
    controller: ontologyPropertiesBlockComponentCtrl
};

ontologyPropertiesBlockComponentCtrl.$inject = ['ontologyStateService', 'propertyManagerService', 'modalService'];

function ontologyPropertiesBlockComponentCtrl(ontologyStateService: OntologyStateService, propertyManagerService, modalService) {
    var dvm = this;
    var pm = propertyManagerService;
    dvm.os = ontologyStateService;
    dvm.properties = [];
    
    dvm.$onChanges = function() {
        dvm.properties = union(pm.ontologyProperties, pm.defaultAnnotations, pm.owlAnnotations, Object.keys(dvm.os.listItem.annotations.iris));
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
        modalService.openConfirmModal(dvm.os.getRemovePropOverlayMessage(key, index), () => {
            dvm.os.removeProperty(key, index).subscribe();
        });
    }
    dvm.editClicked = function(property, index) {
        var propertyObj = dvm.ontology[property][index];
        dvm.os.editingOntologyProperty = true;
        dvm.os.ontologyProperty = property;
        dvm.os.ontologyPropertyIRI = get(propertyObj, '@id');
        dvm.os.ontologyPropertyValue = get(propertyObj, '@value');
        dvm.os.ontologyPropertyType = get(propertyObj, '@type');
        dvm.os.ontologyPropertyIndex = index;
        dvm.os.ontologyPropertyLanguage = get(propertyObj, '@language');
        modalService.openModal('ontologyPropertyOverlay');
    }
    dvm.orderByEntityName = function(iri) {
        return dvm.os.getEntityNameByListItem(iri);
    }
}

export default ontologyPropertiesBlockComponent;
