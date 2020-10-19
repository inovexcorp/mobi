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
import { get, noop } from 'lodash';

import './requestBranchSelect.component.scss';

const template = require('./requestBranchSelect.component.html');

/**
 * @ngdoc component
 * @name merge-requests.component:requestBranchSelect
 * @requires $q
 * @requires shared.service:mergeRequestsStateService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:utilService
 * @requires shared.service:prefixes
 *
 * @description
 * `requestBranchSelect` is a component which creates a div containing a form with ui-selects
 * to choose the source and target Branch for a new MergeRequest. The Branch list is derived from
 * the previously selected VersionedRDFRecord for the MergeRequest. The div also contains a
 * {@link shared.component:commitDifferenceTabset} to display the changes and commits
 * between the selected branches.
 */
const requestBranchSelectComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: requestBranchSelectComponentCtrl
};

requestBranchSelectComponentCtrl.$inject = ['$q', 'mergeRequestsStateService', 'catalogManagerService', 'utilService', 'prefixes'];

function requestBranchSelectComponentCtrl($q, mergeRequestsStateService, catalogManagerService, utilService, prefixes) {
    var dvm = this;
    var cm = catalogManagerService;
    var catalogId = get(cm.localCatalog, '@id');
    dvm.util = utilService;
    dvm.state = mergeRequestsStateService;
    dvm.prefixes = prefixes;

    dvm.state.requestConfig.difference = undefined;
    dvm.branches = [];

    dvm.$onInit = function() {
        dvm.state.requestConfig.entityNames = {};
        dvm.state.requestConfig.difference = undefined;
        dvm.state.requestConfig.previousDiffIris = [];
        dvm.state.requestConfig.startIndex = 0;
        cm.getRecordBranches(dvm.state.requestConfig.recordId, catalogId)
            .then(response => {
                dvm.branches = response.data;
                dvm.state.updateRequestConfigBranch('sourceBranch', dvm.branches);
                dvm.state.updateRequestConfigBranch( 'targetBranch', dvm.branches);
                if (dvm.state.requestConfig.sourceBranch && dvm.state.requestConfig.targetBranch) {
                    return dvm.state.updateRequestConfigDifference();
                }
            }, $q.reject)
            .then(noop, error => {
                dvm.util.createErrorToast(error);
                dvm.branches = [];
            });
    }
    dvm.$onDestroy = function() {
        dvm.state.requestConfig.entityNames = {};
        dvm.state.requestConfig.difference = undefined;
        dvm.state.requestConfig.previousDiffIris = [];
        dvm.state.requestConfig.startIndex = 0;
    }
    dvm.changeSource = function(value) {
        dvm.state.requestConfig.sourceBranch = value;
        if (dvm.state.requestConfig.sourceBranch) {
            dvm.state.requestConfig.sourceBranchId = dvm.state.requestConfig.sourceBranch['@id'];
            if (dvm.state.requestConfig.targetBranch) {
                dvm.state.updateRequestConfigDifference().then(noop, dvm.util.createErrorToast);
            } else {
                dvm.state.requestConfig.difference = undefined;
            }
        } else {
            dvm.state.requestConfig.difference = undefined;
        }
    }
    dvm.changeTarget = function(value) {
        dvm.state.requestConfig.targetBranch = value;
        if (dvm.state.requestConfig.targetBranch) {
            dvm.state.requestConfig.targetBranchId = dvm.state.requestConfig.targetBranch['@id'];
            if (dvm.state.requestConfig.sourceBranch) {
                dvm.state.updateRequestConfigDifference().then(noop, dvm.util.createErrorToast);
            } else {
                dvm.state.requestConfig.difference = undefined;
            }
        } else {
            dvm.state.requestConfig.difference = undefined;
        }
    }
}

export default requestBranchSelectComponent;