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

const template = require('./individualsTab.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:individualsTab
 * @requires shared.service:ontologyStateService
 * @requires shared.service:ontologyManagerService
 * @requires ontology-editor.service:ontologyUtilsManagerService
 * @requires shared.service:modalService
 *
 * @description
 * `individualsTab` is a component that creates a page containing the
 * {@link ontology-editor.component:individualHierarchyBlock} of the current
 * {@link shared.service:ontologyStateService selected ontology} and information about a selected
 * individual from that list. The selected individual display includes a
 * {@link ontology-editor.component:selectedDetails}, a button to delete the individual, a
 * {@link ontology-editor.component:datatypePropertyBlock}, and a
 * {@link ontology-editor.component:objectPropertyBlock}. The component houses the method for opening a
 * modal for deleting individuals.
 */
const individualsTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: individualsTabComponentCtrl
};

individualsTabComponentCtrl.$inject = ['ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService', 'modalService']

function individualsTabComponentCtrl(ontologyStateService, ontologyManagerService, ontologyUtilsManagerService, modalService) {
    var dvm = this;
    var ontoUtils = ontologyUtilsManagerService;
    dvm.os = ontologyStateService;
    dvm.om = ontologyManagerService;

    dvm.showDeleteConfirmation = function() {
        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', ontoUtils.deleteIndividual);
    }
    dvm.seeHistory = function() {
        dvm.os.listItem.seeHistory = true;
    }
}

export default individualsTabComponent;
