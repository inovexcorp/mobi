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

const template = require('./propertiesTab.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:propertiesTab
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires ontology-editor.service:ontologyUtilsManagerService
 * @requires shared.service:modalService
 *
 * @description
 * `propertiesTab` is a component that creates a page containing the
 * {@link ontology-editor.component:propertyHierarchyBlock} of the current
 * {@link shared.service:ontologyStateService selected ontology} and information about a selected
 * property from that list. The selected property display includes a
 * {@link ontology-editor.component:selectedDetails}, a button to delete the property, an
 * {@link ontology-editor.component:annotationBlock}, an {@link ontology-editor.component:axiomBlock}, a
 * {@link ontology-editor.component:characteristicsRow}, and a {@link ontology-editor.component:usagesBlock}.
 * The component houses the method for opening a modal for deleting properties.
 */
const propertiesTabComponent = {
    template,
    scope: {},
    controllerAs: 'dvm',
    controller: propertiesTabComponentCtrl
};

propertiesTabComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'modalService'];

function propertiesTabComponentCtrl(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, modalService) {
    var dvm = this;
    var ontoUtils = ontologyUtilsManagerService;
    dvm.om = ontologyManagerService;
    dvm.os = ontologyStateService;

    dvm.showDeleteConfirmation = function() {
        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', dvm.deleteProperty);
    }
    dvm.deleteProperty = function() {
        if (dvm.om.isObjectProperty(dvm.os.listItem.selected)) {
            ontoUtils.deleteObjectProperty();
        } else if (dvm.om.isDataTypeProperty(dvm.os.listItem.selected)) {
            ontoUtils.deleteDataTypeProperty();
        } else if (dvm.om.isAnnotation(dvm.os.listItem.selected)) {
            ontoUtils.deleteAnnotationProperty();
        }
    }
    dvm.seeHistory = function() {
        dvm.os.listItem.seeHistory = true;
    }
}

export default propertiesTabComponent;
