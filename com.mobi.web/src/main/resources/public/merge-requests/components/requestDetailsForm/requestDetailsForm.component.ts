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

import {get, noop} from "lodash";

const template = require('./requestDetailsForm.component.html');

/**
 * @ngdoc component
 * @name merge-requests.component:requestDetailsForm
 * @requires shared.service:mergeRequestsStateService
 * @requires shared.service:userManagerService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:utilService
 *
 * @description
 * `requestDetailsForm` is a component which creates a div containing a form with inputs for
 * the title, description, and other metadata about a new MergeRequest. The div also contains
 * {@link shared.component:commitDifferenceTabset} to display the changes and
 * commits between the previously selected source and target branch of the Merge Request.
 */
const requestDetailsFormComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: requestDetailsFormComponentCtrl
}

requestDetailsFormComponentCtrl.$inject = ['$q', 'mergeRequestsStateService', 'userManagerService', 'catalogManagerService', 'utilService', 'prefixes'];

function requestDetailsFormComponentCtrl($q, mergeRequestsStateService, userManagerService, catalogManagerService, utilService, prefixes) {
    var dvm = this;
    var cm = catalogManagerService;
    var catalogId = get(cm.localCatalog, '@id');
    dvm.util = utilService;
    dvm.prefixes = prefixes;
    dvm.state = mergeRequestsStateService;
    dvm.um = userManagerService;

    dvm.$onInit = function() {
        dvm.state.requestConfig.title = dvm.util.getDctermsValue(dvm.state.requestConfig.sourceBranch, 'title');
        cm.getRecordBranches(dvm.state.requestConfig.recordId, catalogId)
            .then(response => {
                dvm.state.updateRequestConfigBranch('sourceBranch', response.data);
                dvm.state.updateRequestConfigBranch( 'targetBranch', response.data);
                if (dvm.state.requestConfig.sourceBranch && dvm.state.requestConfig.targetBranch) {
                    return dvm.state.updateRequestConfigDifference();
                } else {
                    dvm.state.createRequestStep = 1;
                    return $q.reject('Branch was deleted');
                }
            }, $q.reject)
            .then(noop, dvm.util.createErrorToast);
    }
}

export default requestDetailsFormComponent;