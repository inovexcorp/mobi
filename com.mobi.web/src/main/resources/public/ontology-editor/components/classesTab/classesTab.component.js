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
     * @name ontology-editor.component:classesTab
     * @requires shared.service:ontologyManagerService
     * @requires shared.service:ontologyStateService
     * @requires ontology-editor.service:ontologyUtilsManagerService
     * @requires shared.service:modalService
     *
     * @description
     * `classesTab` is a component that creates a page containing the
     * {@link ontology-editor.component:classHierarchyBlock} of the current
     * {@link shared.service:ontologyStateService selected ontology} and information about a
     * selected class from that list. The selected class display includes a
     * {@link ontology-editor.component:selectedDetails}, a button to delete the class, an
     * {@link ontology-editor.component:annotationBlock}, an {@link ontology-editor.component:axiomBlock}, and a
     * {@link ontology-editor.component:usagesBlock}. The component houses the method for opening a modal for deleting
     * classes.
     */
    const classesTabComponent = {
        templateUrl: 'ontology-editor/components/classesTab/classesTab.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: classesTabComponentCtrl
    };

    classesTabComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'modalService'];

    function classesTabComponentCtrl(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, modalService) {
        var dvm = this;
        var ontoUtils = ontologyUtilsManagerService
        dvm.os = ontologyStateService;
        dvm.om = ontologyManagerService;

        dvm.showDeleteConfirmation = function() {
            modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', ontoUtils.deleteClass);
        }
        dvm.seeHistory = function() {
            dvm.os.listItem.seeHistory = true;
        }
    }

    angular.module('ontology-editor')
        .component('classesTab', classesTabComponent);
})();
