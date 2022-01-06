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
import { filter, concat, includes } from 'lodash';

const template = require('./conceptSchemesTab.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:conceptSchemesTab
 * @requires shared.service:ontologyStateService
 * @requires shared.service:ontologyManagerService
 * @requires ontology-editor.service:ontologyUtilsManagerService
 * @requires shared.service:modalService
 *
 * @description
 * `conceptSchemesTab` is a component that creates a page containing the
 * {@link ontology-editor.component:conceptSchemeHierarchyBlock} of the current
 * {@link shared.service:ontologyStateService selected ontology/vocabulary} and information about a
 * selected entity from that list. The selected entity display includes a
 * {@link ontology-editor.component:selectedDetails}, a button to delete the entity, an
 * {@link ontology-editor.component:annotationBlock}, a {@link ontology-editor.component:datatypePropertyBlock},
 * and a {@link ontology-editor.component:usagesBlock}. The component houses the method for opening a modal for
 * deleting concepts or concept schemes.
 */
const conceptSchemesTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: conceptSchemesTabComponentCtrl
};

conceptSchemesTabComponentCtrl.$inject = ['ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService', 'modalService'];

function conceptSchemesTabComponentCtrl(ontologyStateService, ontologyManagerService, ontologyUtilsManagerService, modalService) {
    var dvm = this;
    var ontoUtils = ontologyUtilsManagerService;
    dvm.om = ontologyManagerService;
    dvm.os = ontologyStateService;

    dvm.showDeleteConfirmation = function() {
        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', dvm.deleteEntity);
    }
    dvm.deleteEntity = function() {
        if (dvm.om.isConcept(dvm.os.listItem.selected, dvm.os.listItem.derivedConcepts)) {
            ontoUtils.deleteConcept();
        } else if (dvm.om.isConceptScheme(dvm.os.listItem.selected, dvm.os.listItem.derivedConceptSchemes)) {
            ontoUtils.deleteConceptScheme();
        }
    }
    dvm.seeHistory = function() {
        dvm.os.listItem.seeHistory = true;
    }
}

export default conceptSchemesTabComponent;
