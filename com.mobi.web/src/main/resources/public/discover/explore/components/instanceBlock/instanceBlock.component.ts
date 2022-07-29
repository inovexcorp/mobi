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
import { initial, merge, head, last } from 'lodash';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';

import './instanceBlock.component.scss';

const template = require('./instanceBlock.component.html');

/**
 * @ngdoc component
 * @name explore.component:instanceBlock
 * @requires $http
 * @requires shared.filter:splitIRIFilter
 * @requires shared.service:discoverStateService
 * @requires discover.service:exploreService
 * @requires shared.service:utilService
 * @requires uuid
 * @requires shared.service:prefixes
 * @requires shared.service:policyEnforcementService
 *
 * @description
 * HTML contents in the instance block which shows the users the instances associated
 * with the class they have selected. They have a bread crumb trail to get back to early
 * pages and pagination controls at the bottom of the page.
 */
const instanceBlockComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: instanceBlockComponentCtrl
};

instanceBlockComponentCtrl.$inject = ['$filter', 'discoverStateService', 'exploreService', 'utilService', 'uuid', 'prefixes', 'policyEnforcementService'];

function instanceBlockComponentCtrl($filter, discoverStateService: DiscoverStateService, exploreService, utilService, uuid, prefixes, policyEnforcementService) {
    const dvm = this;
    const es = exploreService;
    const util = utilService;
    const pep = policyEnforcementService;
    dvm.ds = discoverStateService;

    dvm.setPage = function(page) {
        const pepRequest = {
            resourceId: dvm.ds.explore.recordId,
            actionId: prefixes.policy + 'Read'
        };
        pep.evaluateRequest(pepRequest)
            .then(response => {
                const canRead = response !== pep.deny;
                if (canRead) {
                    dvm.ds.explore.instanceDetails.currentPage = page;
                    const pagingObj = {
                        limit: dvm.ds.explore.instanceDetails.limit,
                        offset: (dvm.ds.explore.instanceDetails.currentPage - 1) * dvm.ds.explore.instanceDetails.limit
                    };
                    es.getClassInstanceDetails(dvm.ds.explore.recordId, dvm.ds.explore.classId, pagingObj)
                        .then(response => {
                            dvm.ds.explore.hasPermissionError = false;
                            dvm.ds.explore.instanceDetails.data = [];
                            merge(dvm.ds.explore.instanceDetails, es.createPagedResultsObject(response));
                        }, util.createErrorToast); 
                } else {
                    util.createErrorToast('You don\'t have permission to read dataset');
                    dvm.ds.explore.instanceDetails.data = []
                    dvm.ds.explore.breadcrumbs = initial(dvm.ds.explore.breadcrumbs);
                    dvm.ds.explore.hasPermissionError = true;
                }
            }, () => {
                util.createWarningToast('Could not retrieve record permissions');
            });
    }
    dvm.create = function() {
        const pepRequest = {
            resourceId: dvm.ds.explore.recordId,
            actionId: prefixes.catalog + 'Modify'
        };
        pep.evaluateRequest(pepRequest)
            .then(response => {
                const canModify = response !== pep.deny;
                if (canModify) {
                    dvm.ds.explore.creating = true;
                    let details : any = head(dvm.ds.explore.instanceDetails.data)
                    var split = $filter('splitIRI')(details.instanceIRI);
                    var iri = split.begin + split.then + uuid.v4();
                    dvm.ds.explore.instance.entity = [{
                        '@id': iri,
                        '@type': [dvm.ds.explore.classId]
                    }];
                    dvm.ds.explore.instance.metadata.instanceIRI = iri;
                    dvm.ds.explore.breadcrumbs.push('New Instance');
                } else {
                    util.createErrorToast('You don\'t have permission to modify dataset');
                }
            }, () => {
                util.createWarningToast('Could not retrieve record permissions');
            });
    }
    dvm.getClassName = function() {
        return last(dvm.ds.explore.breadcrumbs);
    }
}

export default instanceBlockComponent;
