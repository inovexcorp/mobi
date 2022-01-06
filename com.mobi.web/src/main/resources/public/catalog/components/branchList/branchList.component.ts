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
import { isEmpty, find, forEach, get, filter } from 'lodash';

const template = require('./branchList.component.html');

/**
 * @ngdoc component
 * @name catalog.component:branchList
 * @requires shared.service:catalogManagerService
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:utilService
 * @requires shared.service:prefixes
 *
 * @description
 * `branchList` is a component which creates a list of expansion panels for all the Branches in the provided catalog
 * Record. If the provided Record is not a VersionedRDFRecord, no branches will be shown. The panel for each Branch
 * shows the title, description, and {@link shared.component:commitHistoryTable}. Only one panel can be open at a
 * time.
 * 
 * @param {Object} record A JSON-LD object for a catalog Record
 */
const branchListComponent = {
    template,
    bindings: {
        record: '<'
    },
    controllerAs: 'dvm',
    controller: branchListComponentCtrl
};

branchListComponentCtrl.$inject = ['catalogManagerService', 'ontologyManagerService', 'utilService', 'prefixes'];

function branchListComponentCtrl(catalogManagerService, ontologyManagerService, utilService, prefixes) {
    var dvm = this;
    var cm = catalogManagerService;
    var om = ontologyManagerService;
    dvm.util = utilService;
    dvm.prefixes = prefixes;
    dvm.totalSize = 0;
    dvm.branches = [];
    dvm.catalogId = '';
    var increment = 10;
    dvm.limit = increment;
    dvm.recordId = undefined;

    dvm.$onInit = function() {
        if (dvm.record && !isEmpty(dvm.record)) {
            dvm.catalogId = dvm.util.getPropertyId(dvm.record, prefixes.catalog + 'catalog');
            dvm.setBranches();
        }
    }
    dvm.$onChanges = function() {
        if (dvm.record && !isEmpty(dvm.record)) {
            dvm.catalogId = dvm.util.getPropertyId(dvm.record, prefixes.catalog + 'catalog');
            dvm.setBranches();
        }
    }
    dvm.loadMore = function () {
        dvm.limit += increment;
        dvm.setBranches();
    }
    dvm.showPanel = function(branch) {
        forEach(dvm.branches, result => delete result.show);
        branch.show = true;
    }
    dvm.setBranches = function() {
        dvm.recordId = om.isOntologyRecord(dvm.record) ? dvm.record['@id'] : undefined;
        if (cm.isVersionedRDFRecord(dvm.record)) {
            var paginatedConfig = {
                pageIndex: 0,
                limit: dvm.limit,
                sortOption: find(cm.sortOptions, {field: prefixes.dcterms + 'modified', asc: false})
            };
            cm.getRecordBranches(dvm.record['@id'], dvm.catalogId, paginatedConfig)
                .then(response => {
                    dvm.branches = filter(response.data, branch => !cm.isUserBranch(branch));
                    var headers = response.headers();
                    dvm.totalSize = get(headers, 'x-total-count', 0) - (response.data.length - dvm.branches.length);
                }, dvm.util.createErrorToast);
        }
    }
}

export default branchListComponent;
