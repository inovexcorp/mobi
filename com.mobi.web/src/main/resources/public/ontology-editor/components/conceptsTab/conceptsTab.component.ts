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
import { filter, concat, includes } from 'lodash';

const template = require('./conceptsTab.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:conceptsTab
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires ontology-editor.service:ontologyUtilsManagerService
 * @requires shared.service:propertyManagerService
 * @requires shared.service:modalService
 *
 * @description
 * `conceptsTab` is a component that creates a page containing the
 * {@link ontology-editor.component:conceptHierarchyBlock} of the current
 * {@link shared.service:ontologyStateService selected ontology/vocabulary} and information about a
 * selected concept from that list. The selected concept display includes a
 * {@link ontology-editor.component:selectedDetails}, a button to delete the concept, an
 * {@link ontology-editor.component:annotationBlock}, and a {@link ontology-editor.component:usagesBlock}.
 * The component houses the method for opening a modal for deleting concepts.
 */
const conceptsTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: conceptsTabComponentCtrl
};

conceptsTabComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'propertyManagerService', 'modalService'];

function conceptsTabComponentCtrl(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, propertyManagerService, modalService) {
    var dvm = this;
    var pm = propertyManagerService;
    var ontoUtils = ontologyUtilsManagerService;
    dvm.om = ontologyManagerService;
    dvm.os = ontologyStateService;
    dvm.relationshipList = [];

    dvm.$onInit = function() {
        var schemeRelationships = filter(pm.conceptSchemeRelationshipList, iri => includes(dvm.os.listItem.iriList, iri));
        dvm.relationshipList = concat(dvm.os.listItem.derivedSemanticRelations, schemeRelationships);
    }
    dvm.showDeleteConfirmation = function() {
        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', ontoUtils.deleteConcept);
    }
    dvm.seeHistory = function() {
        dvm.os.listItem.seeHistory = true;
    }
}

export default conceptsTabComponent;