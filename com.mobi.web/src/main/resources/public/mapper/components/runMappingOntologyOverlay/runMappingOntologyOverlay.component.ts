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
import { find, get } from 'lodash';

const template = require('./runMappingOntologyOverlay.component.html');

/**
 * @ngdoc component
 * @name mapper.component:runMappingOntologyOverlay
 * @requires shared.service:mapperStateService
 * @requires shared.service:delimitedManagerService
 * @requires shared.service:utilService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:ontologyStateService
 * @requires shared.service:prefixes
 *
 * @description
 * `runMappingOntologyOverlay` is a component that creates content for a modal that contains a configuration
 * settings for running the currently selected {@link shared.service:mapperStateService#mapping mapping} against the
 * uploaded {@link shared.service:delimitedManagerService#dataRows delimited data} and committing the results to an
 * Ontology. This includes `ui-select`s to determine which ontology and which branch to commit the mapping to. The
 * user can also choose whether the result data should be considered additions or changes to the existing data on
 * that branch. Meant to be used in conjunction with the {@link shared.service:modalService}.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const runMappingOntologyOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: runMappingOntologyOverlayComponentCtrl,
};

runMappingOntologyOverlayComponentCtrl.$inject = ['mapperStateService', 'delimitedManagerService', 'utilService', 'catalogManagerService', 'ontologyStateService', 'prefixes'];

function runMappingOntologyOverlayComponentCtrl(mapperStateService, delimitedManagerService, utilService, catalogManagerService, ontologyStateService, prefixes) {
    var dvm = this;
    var state = mapperStateService;
    var dm = delimitedManagerService;
    var cm = catalogManagerService;
    var os = ontologyStateService;
    dvm.util = utilService;
    dvm.errorMessage = '';
    dvm.ontologies = [];
    dvm.branches = [];
    dvm.branchId = undefined;
    dvm.ontology = undefined;
    dvm.update = false;

    dvm.changeOntology = function(ontologyRecord) {
        if (ontologyRecord) {
            setOntologyBranches(ontologyRecord);
        }
    }
    dvm.getOntologyIRI = function(ontology) {
        return dvm.util.getPropertyId(ontology, prefixes.ontEdit + 'ontologyIRI');
    }
    dvm.getOntologies = function(searchText) {
        var catalogId = get(cm.localCatalog, '@id', '');
        var paginatedConfig = {
            limit: 50,
            recordType: prefixes.ontologyEditor + 'OntologyRecord',
            sortOption: find(cm.sortOptions, {field: 'http://purl.org/dc/terms/title', asc: true}),
            searchText
        };
        cm.getRecords(catalogId, paginatedConfig, 'test')
            .then(response => {
                dvm.ontologies = response.data;
            });
    }
    dvm.run = function() {
        if (state.editMapping && state.isMappingChanged()) {
            state.saveMapping().then(runMapping, onError);
        } else {
            runMapping(state.mapping.record.id);
        }
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }

    function onError(errorMessage) {
        dvm.errorMessage = errorMessage;
    }
    function runMapping(id) {
        state.mapping.record.id = id;
        dm.mapAndCommit(id, dvm.ontology['@id'], dvm.branchId, dvm.update).then(response => {
            if (response.status === 204) {
                dvm.util.createWarningToast('No commit was submitted, commit was empty due to duplicate data', {timeOut: 8000});
                reset();
            } else {
                testOntology(dvm.ontology)
                reset();
            }
        }, onError);
    }
    function reset() {
        state.step = state.selectMappingStep;
        state.initialize();
        state.resetEdit();
        dm.reset();
        dvm.close();
    }
    function testOntology(ontologyRecord) {
        var item = find(os.list, {ontologyRecord: {recordId: ontologyRecord['@id']}});
        var toast = false;
        if (item) {
            if (get(item, 'ontologyRecord.branchId') === dvm.branchId) {
                item.upToDate = false;
                if (item.merge.active) {
                    dvm.util.createWarningToast('You have a merge in progress in the Ontology Editor for ' + dvm.util.getDctermsValue(ontologyRecord, 'title') + ' that is out of date. Please reopen the merge form.', {timeOut: 5000});
                    toast = true;
                }
            }
            if (item.merge.active && get(item.merge.target, '@id') === dvm.branchId) {
                dvm.util.createWarningToast('You have a merge in progress in the Ontology Editor for ' + dvm.util.getDctermsValue(ontologyRecord, 'title') + ' that is out of date. Please reopen the merge form to avoid conflicts.', {timeOut: 5000});
                toast = true;
            }
        }
        if (!toast) {
            dvm.util.createSuccessToast('Successfully ran mapping');
        }
    }
    function setOntologyBranches(ontologyRecord) {
        var catalogId = get(cm.localCatalog, '@id', '');
        var recordId = get(ontologyRecord, '@id', '');
        var paginatedConfig = {
            sortOption: find(cm.sortOptions, {field: 'http://purl.org/dc/terms/title', asc: true}),
        };
        if (recordId) {
            return cm.getRecordBranches(recordId, catalogId, paginatedConfig)
                .then(response => {
                    dvm.branches = response.data;
                    dvm.branchId = get(find(dvm.branches, branch => dvm.util.getDctermsValue(branch, 'title') === 'MASTER'), '@id');
                });
        }
    }
}

export default runMappingOntologyOverlayComponent;