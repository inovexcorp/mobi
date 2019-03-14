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
     * @name mapper.component:editMappingForm
     * @requires shared.service:mapperStateService
     * @requires shared.service:utilService
     * @requires shared.service:modalService
     *
     * @description
     * `editMappingForm` is a component that creates a div with a section to view and edit the current
     * {@link shared.service:mapperStateService mapping} configuration, a section to
     * {@link mapper.component:classMappingSelect select a class mapping} and delete the selected class mapping, a
     * button to {@link mapper.component:classMappingOverlay add a new class mapping}, and
     * {@link mapper.component:classMappingDetails class mapping details}. The component houses the
     * method for opening a modal to remove a ClassMapping.
     */
    const editMappingFormComponent = {
        templateUrl: 'mapper/components/editMappingForm/editMappingForm.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: editMappingFormComponentCtrl
    };

    editMappingFormComponentCtrl.$inject = ['mapperStateService', 'mappingManagerService', 'utilService', 'modalService'];

    function editMappingFormComponentCtrl(mapperStateService, mappingManagerService, utilService, modalService) {
        var dvm = this;
        dvm.mm = mappingManagerService;
        dvm.state = mapperStateService;
        dvm.util = utilService;
        dvm.classMappings = [];

        dvm.$onInit = function() {
            dvm.setClassMappings();
        }
        dvm.openClassMappingOverlay = function() {
            modalService.openModal('classMappingOverlay', {}, dvm.setClassMappings);
        }
        dvm.openMappingConfig = function() {
            modalService.openModal('mappingConfigOverlay', {}, dvm.setClassMappings, 'lg');
        }
        dvm.confirmDeleteClass = function() {
            modalService.openConfirmModal('<p>Are you sure you want to delete <strong>' + dvm.getEntityName(dvm.state.selectedClassMappingId) + '</strong>?</p><p class="form-text">Deleting a class will remove any properties that link to it.</p>', dvm.deleteClass);
        }
        dvm.deleteClass = function() {
            dvm.state.deleteClass(dvm.state.selectedClassMappingId);
            dvm.state.resetEdit();
            dvm.state.selectedClassMappingId = '';
            dvm.setClassMappings();
        }
        dvm.getEntityName = function(id) {
            return dvm.util.getDctermsValue(_.find(dvm.state.mapping.jsonld, {'@id': id}), 'title');
        }
        dvm.setClassMappings = function() {
            dvm.classMappings = dvm.mm.getAllClassMappings(dvm.state.mapping.jsonld);
        }
    }

    angular.module('mapper')
        .component('editMappingForm', editMappingFormComponent);
})();
