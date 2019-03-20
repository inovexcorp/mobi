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
     * @name mapper.component:mappingSelectPage
     * @requires shared.service:mapperStateService
     * @requires shared.service:mappingManagerService
     * @requires shared.service:utilService
     * @requires shared.service:modalService
     *
     * @description
     * `mappingSelectPage` is a component that creates a Bootstrap `row` div with two columns for selecting and
     * previewing a mapping. The left column contains a {@link mapper.component:mappingListBlock mappingListBlock} for
     * selecting the current {@link shared.service:mapperStateService#mapping mapping}. The right column contains a
     * {@link mapper.component:mappingPreview mappingPreview} of the selected mapping and buttons for editing running,
     * duplicating, and downloading the mapping.
     */
    const mappingSelectPageComponent = {
        templateUrl: 'mapper/components/mappingSelectPage/mappingSelectPage.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: mappingSelectPageComponentCtrl
    };

    mappingSelectPageComponentCtrl.$inject = ['mapperStateService', 'mappingManagerService', 'utilService', 'modalService'];

    function mappingSelectPageComponentCtrl(mapperStateService, mappingManagerService, utilService, modalService) {
        var dvm = this;
        var mm = mappingManagerService;
        dvm.state = mapperStateService;
        dvm.util = utilService;

        dvm.run = function() {
            dvm.state.mappingSearchString = '';
            dvm.state.highlightIndexes = dvm.state.getMappedColumns();
            dvm.loadOntologyAndContinue();
        }
        dvm.edit = function() {
            dvm.state.mappingSearchString = '';
            dvm.state.editMapping = true;
            dvm.loadOntologyAndContinue();
        }
        dvm.download = function() {
            modalService.openModal('downloadMappingOverlay', {}, undefined, 'sm');
        }
        dvm.duplicate = function() {
            modalService.openModal('createMappingOverlay');
        }
        dvm.loadOntologyAndContinue = function() {
            mm.getSourceOntologies(mm.getSourceOntologyInfo(dvm.state.mapping.jsonld)).then(ontologies => {
                if (mm.areCompatible(dvm.state.mapping.jsonld, ontologies)) {
                    dvm.state.sourceOntologies = ontologies;
                    dvm.state.availableClasses = dvm.state.getClasses(ontologies);
                    dvm.state.mappingSearchString = '';
                    dvm.state.step = dvm.state.fileUploadStep;
                } else {
                    dvm.util.createErrorToast('The source ontology for the ' + dvm.state.mapping.record.title + ' mapping and/or its imported ontologies have been changed and are no longer compatible. Unable to open the mapping', {timeOut: 8000});
                }
            });
        }
    }

    angular.module('mapper')
        .component('mappingSelectPage', mappingSelectPageComponent);
})();
