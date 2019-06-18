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
     * @name ontology-editor.component:overviewTab
     * @requires shared.service:ontologyManagerService
     * @requires shared.service:ontologyStateService
     * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
     * @requires shared.service:modalService
     *
     * @description
     * `overviewTab` is a component that creates a page containing the
     * {@link ontology-editor.component:associationBlock class and property list} of the current
     * {@link shared.service:ontologyStateService selected ontology} and information about a
     * selected item from that list. The selected entity display includes a
     * {@link ontology-editor.component:selectedDetails}, a button to delete the entity, an
     * {@link ontology-editor.component:annotationBlock}, an {@link ontology-editor.component:axiomBlock}, and a
     * {@link ontology-editor.component:usagesBlock}. If the selected entity is a property, a
     * {@link ontology-editor.component:characteristicsRow} is also displayed. The component houses the method
     * for opening the modal to delete an entity.
     */
    const overviewTabComponent = {
        templateUrl: 'ontology-editor/components/overviewTab/overviewTab.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: overviewTabComponentCtrl
    };

    overviewTabComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'modalService'];

    function overviewTabComponentCtrl(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, modalService) {
        var dvm = this;
        var ontoUtils = ontologyUtilsManagerService;
        dvm.os = ontologyStateService;
        dvm.om = ontologyManagerService;

        dvm.showDeleteConfirmation = function() {
            modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', dvm.deleteEntity);
        }
        dvm.deleteEntity = function() {
            if (dvm.om.isClass(dvm.os.listItem.selected)) {
                ontoUtils.deleteClass();
            } else if (dvm.om.isObjectProperty(dvm.os.listItem.selected)) {
                ontoUtils.deleteObjectProperty();
            } else if (dvm.om.isDataTypeProperty(dvm.os.listItem.selected)) {
                ontoUtils.deleteDataTypeProperty();
            }
        }
        dvm.seeHistory = function() {
            dvm.os.listItem.seeHistory = true;
        }
    }

    angular.module('ontology-editor')
        .component('overviewTab', overviewTabComponent);
})();
