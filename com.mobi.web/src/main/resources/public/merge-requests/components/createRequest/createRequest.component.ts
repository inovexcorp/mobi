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
import './createRequest.component.scss';

const template = require('./createRequest.component.html');

/**
 * @ngdoc component
 * @name merge-requests.component:createRequest
 * @requires shared.service:mergeRequestsStateService
 *
 * @description
 * `createRequest` is a component which creates a div containing a
 * {@link shared.component:block} with the workflow steps of creating a MergeRequest. These steps are
 * {@link merge-requests.component:requestRecordSelect},
 * {@link merge-requests.component:requestBranchSelect}, and
 * {@link merge-requests.component:requestDetailsForm}.
 */
const createRequestComponent = {
    template,
    bindings: {
        commits: '<'
    },
    controllerAs: 'dvm',
    controller: createRequestComponentCtrl
};

createRequestComponentCtrl.$inject = ['mergeRequestManagerService', 'mergeRequestsStateService', 'utilService', 'prefixes'];

function createRequestComponentCtrl(mergeRequestManagerService, mergeRequestsStateService, utilService, prefixes) {
    var dvm = this;
    var util = utilService;
    var mm = mergeRequestManagerService;
    dvm.state = mergeRequestsStateService;
    dvm.commits = [];

    dvm.next = function() {
        if (dvm.state.createRequestStep < 2) {
            dvm.state.createRequestStep++;
        } else {
            mm.createRequest(dvm.state.requestConfig)
                .then(iri => {
                    util.createSuccessToast('Successfully created request');
                    dvm.state.createRequest = false;
                }, util.createErrorToast);
        }
    }
    dvm.back = function() {
        if (dvm.state.createRequestStep > 0) {
            dvm.state.createRequestStep--;
            if (dvm.state.createRequestStep === 1) {
                dvm.state.requestConfig.title = '';
                dvm.state.requestConfig.description = '';
                dvm.state.requestConfig.assignees = [];
                dvm.state.requestConfig.removeSource = false;
            } else if (dvm.state.createRequestStep === 0) {
                dvm.state.requestConfig.sourceBranchId = '';
                dvm.state.requestConfig.targetBranchId = '';
                delete dvm.state.requestConfig.sourceBranch;
                delete dvm.state.requestConfig.targetBranch;
                delete dvm.state.requestConfig.difference;
                delete dvm.state.requestConfig.removeSource;
                delete dvm.state.requestConfig.sameBranch;
            }
            } else {
            dvm.state.createRequest = false;
        }
    }
    dvm.isDisabled = function() {
        if (dvm.state.createRequestStep > 0 && !(dvm.commits?.length > 0)) {
            return true
        }

        if (dvm.state.createRequestStep === 0) {
            return !dvm.state.requestConfig.recordId;
        } else if (dvm.state.createRequestStep === 1) {
            return !dvm.state.requestConfig.sourceBranchId || !dvm.state.requestConfig.targetBranchId
                || dvm.state.requestConfig.sameBranch
        } else {
            return !dvm.state.requestConfig.title;
        }
    }
    dvm.updateCommits = function(commits) {
        dvm.commits = commits;
    }
}

export default createRequestComponent;
