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
import { some, find, noop, remove, get, isEmpty, forEach } from 'lodash';

import './openOntologyTab.component.scss';

const template = require('./openOntologyTab.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:openOntologyTab
 * @requires shared.service:httpService
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires shared.service:prefixes
 * @requires shared.service:utilService
 * @requires shared.service:mapperStateService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:modalService
 * @requires shared.service:policyEnforcementService
 * @requires shared.service:policyManagerService
 *
 * @description
 * `openOntologyTab` is a component that creates a page for opening ontologies. The page includes a
 * {@link shared.component:searchBar} and a paginated list of ontologies with
 * {@link shared.component:actionMenu action menus} to manage and delete. In addition, the page includes buttons
 * for {@link ontology-editor.component:newOntologyTab creating new ontologies} and
 * {@link ontology-editor.component:uploadOntologyTab uploading ontologies}. The component houses a method
 * for opening the modal deleting an ontology.
 */
const openOntologyTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: openOntologyTabComponentCtrl
};

openOntologyTabComponentCtrl.$inject = ['httpService', 'ontologyManagerService', 'ontologyStateService', 'prefixes', 'utilService', 'mapperStateService', 'catalogManagerService', 'modalService', 'settingManagerService', 'policyEnforcementService', 'policyManagerService'];

function openOntologyTabComponentCtrl(httpService, ontologyManagerService, ontologyStateService, prefixes, utilService, mapperStateService, catalogManagerService, modalService, settingManagerService, policyEnforcementService, policyManagerService) {
    var dvm = this;
    var cm = catalogManagerService;
    var pe = policyEnforcementService;
    var pm = policyManagerService;
    var sm = settingManagerService;
    var ontologyRecords = [];

    dvm.prefixes = prefixes;
    dvm.om = ontologyManagerService;
    dvm.os = ontologyStateService;
    dvm.ms = mapperStateService;
    dvm.util = utilService;
    dvm.currentPage = 1;
    dvm.limit = 10;
    dvm.totalSize = 0;
    dvm.filteredList = [];
    dvm.id = 'openOntologyTabTargetedSpinner';

    dvm.$onInit = function() {
        dvm.getPageOntologyRecords(1, '');
    }
    dvm.clickUpload = function(id) {
        var upload = <HTMLInputElement> document.getElementById(id);

        upload.value = null;
        upload.click();
    }
    dvm.updateFiles = function(event, files) {
        dvm.os.uploadFiles = files;
        dvm.showUploadOntologyOverlay();
    }
    dvm.showUploadOntologyOverlay = function() {
        modalService.openModal('uploadOntologyOverlay', {startUpload: dvm.startUpload, finishUpload: dvm.finishUpload});
    }
    dvm.startUpload = function() {
        dvm.os.uploadPending += 1;
        dvm.showSnackbar = true;
    }
    dvm.finishUpload = function() {
        dvm.os.uploadPending -= 1;
        if (dvm.os.uploadPending === 0) {
            dvm.search();
        }
    }
    dvm.isOpened = function(record) {
        return some(dvm.os.list, {ontologyRecord: {recordId: record['@id']}});
    }
    dvm.open = function(record) {
        var listItem = find(dvm.os.list, {ontologyRecord: {recordId: record['@id']}});
        if (listItem) {
            dvm.os.listItem = listItem;
            dvm.os.listItem.active = true;
        } else {
            dvm.os.openOntology(record['@id'], dvm.util.getDctermsValue(record, 'title'))
                .then(noop, dvm.util.createErrorToast);
        }
    }
    dvm.newOntology = function() {
        dvm.os.newOntology = {
            '@id': sm.defaultNamespace,
            '@type': [prefixes.owl + 'Ontology'],
            [prefixes.dcterms + 'title']: [{
                '@value': ''
            }],
            [prefixes.dcterms + 'description']: [{
                '@value': ''
            }]
        };
        dvm.os.newKeywords = [];
        dvm.os.newLanguage = undefined;
        modalService.openModal('newOntologyOverlay');
    }
    dvm.showDeleteConfirmationOverlay = function(record) {
        dvm.recordId = get(record, '@id', '');

        var msg = '';
        if (find(dvm.ms.sourceOntologies, {recordId: dvm.recordId})) {
            msg += '<error-display>Warning: The ontology you\'re about to delete is currently open in the mapping tool.</error-display>';
        }
        modalService.openConfirmModal(msg + '<p>Are you sure that you want to delete <strong>' + dvm.util.getDctermsValue(record, 'title') + '</strong>?</p>', dvm.deleteOntology);
    }
    dvm.deleteOntology = function() {
        dvm.om.deleteOntology(dvm.recordId)
            .then(response => {
                remove(ontologyRecords, record => get(record, '@id', '') === dvm.recordId);
                dvm.os.closeOntology(dvm.recordId);
                var state = dvm.os.getOntologyStateByRecordId(dvm.recordId);
                if (!isEmpty(state)) {
                    dvm.os.deleteOntologyState(dvm.recordId);
                }
                dvm.getPageOntologyRecords(1, dvm.filterText);
            }, dvm.util.createErrorToast);
    }
    dvm.getPageOntologyRecords = function(page, inputFilterText) {
        dvm.currentPage = page;
        var catalogId = get(cm.localCatalog, '@id', '');
        var paginatedConfig = {
            pageIndex: dvm.currentPage - 1,
            limit: dvm.limit,
            recordType: prefixes.ontologyEditor + 'OntologyRecord',
            sortOption: find(cm.sortOptions, {field: 'http://purl.org/dc/terms/title', asc: true}),
            searchText: inputFilterText
        };
        httpService.cancel(dvm.id);
        cm.getRecords(catalogId, paginatedConfig, dvm.id).then(response => {
            dvm.filteredList = response.data;
            if (response.headers() !== undefined) {
                dvm.totalSize = get(response.headers(), 'x-total-count');
            }
            dvm.manageRecords();
        });
    }
    dvm.search = function(event) {
        dvm.getPageOntologyRecords(1, dvm.filterText);
    }
    dvm.manageRecords = function() {
        forEach(dvm.filteredList, record => {
            var request = {
                resourceId: 'http://mobi.com/policies/record/' + encodeURIComponent(record['@id']),
                actionId: pm.actionUpdate
            }
            pe.evaluateRequest(request).then(decision => {
                record.userCanManage = decision == pe.permit;
                record.showAccessControls = false;
            });
        })
    }
    dvm.showAccessOverlay = function(record, ruleId) {
        modalService.openModal('recordAccessOverlay', {ruleId, resource: record['@id']});
    }
}

export default openOntologyTabComponent;