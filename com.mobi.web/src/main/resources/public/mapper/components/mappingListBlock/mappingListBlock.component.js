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
     * @name mapper.component:mappingListBlock
     * @requires shared.service:mappingManagerService
     * @requires shared.service:mapperStateService
     * @requires shared.service:catalogManagerService
     * @requires shared.service:prefixes
     * @requires shared.service:modalService
     *
     * @description
     * `mappingListBlock` is a component that creates a div with an unordered list of the all the saved mappings in
     * the repository. Each mapping name is clickable and sets the selected
     * {@link shared.service:mapperStateService#mapping mapping} for the mapping tool. The list will also be
     * filtered by the {@link shared.service:mapperStateService#mappingSearchString mappingSearchString}. Also
     * includes a button for {@link createMappingOverlay.component:createMappingOverlay creating a mapping}. The
     * component houses the method for opening a modal to confirm deleting a mapping.
     */
    const mappingListBlockComponent = {
        templateUrl: 'mapper/components/mappingListBlock/mappingListBlock.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: mappingListBlockComponentCtrl
    };

    mappingListBlockComponentCtrl.$inject = ['$q', 'utilService', 'mappingManagerService', 'mapperStateService', 'catalogManagerService', 'prefixes', 'modalService'];

    function mappingListBlockComponentCtrl($q, utilService, mappingManagerService, mapperStateService, catalogManagerService, prefixes, modalService) {
        var dvm = this;
        dvm.state = mapperStateService;
        dvm.mm = mappingManagerService;
        dvm.cm = catalogManagerService;
        dvm.util = utilService;
        dvm.list = [];

        dvm.$onInit = function() {
            setRecords();
        }
        dvm.confirmDeleteMapping = function() {
            modalService.openConfirmModal('<p>Are you sure you want to delete <strong>' + dvm.state.mapping.record.title + '</strong>?</p>', dvm.deleteMapping);
        }
        dvm.createMapping = function() {
            dvm.state.mapping = undefined;
            modalService.openModal('createMappingOverlay');
        }
        dvm.deleteMapping = function() {
            dvm.mm.deleteMapping(dvm.state.mapping.record.id)
                .then(() => {
                    _.remove(dvm.state.openedMappings, {record: {id: dvm.state.mapping.record.id}});
                    dvm.state.mapping = undefined;
                    dvm.state.sourceOntologies = [];
                    setRecords();
                }, dvm.util.createErrorToast);
        }

        function setRecords() {
            var catalogId = _.get(dvm.cm.localCatalog, '@id', '');
            var paginatedConfig = {
                pageIndex: 0,
                limit: 0,
                recordType: prefixes.delim + 'MappingRecord',
                sortOption: _.find(dvm.cm.sortOptions, {field: 'http://purl.org/dc/terms/title', asc: true})
            };
            dvm.cm.getRecords(catalogId, paginatedConfig)
                .then(response => {
                    dvm.list = _.map(response.data, record => ({
                        id: record['@id'],
                        title: dvm.util.getDctermsValue(record, 'title'),
                        description: dvm.util.getDctermsValue(record, 'description'),
                        keywords: _.map(_.get(record, "['" + prefixes.catalog + "keyword']", []), '@value'),
                        branch: dvm.util.getPropertyId(record, prefixes.catalog + 'masterBranch')
                    }));
                }, dvm.util.createErrorToast);
        }
    }

    angular.module('mapper')
        .component('mappingListBlock', mappingListBlockComponent);
})();
