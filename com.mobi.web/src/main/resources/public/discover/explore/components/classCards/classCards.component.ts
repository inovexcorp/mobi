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
import { merge, chunk, orderBy, initial } from 'lodash';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';

import './classCards.component.scss';

const template = require('./classCards.component.html');
    
/**
 * @ngdoc component
 * @name explore.component:classCards
 * @requires shared.service:discoverStateService
 * @requires discover.service:exploreService
 * @requires shared.service:utilService
 *
 * @description
 * `classCards` is a component that creates a div which contains a 3 column grid used to display the
 * class details associated with a dataset record.
 *
 * @param {Object[]} classDetails the details about the classes to be presented as cards
 */
const classCardsComponent = {
    template,
    bindings: {
        classDetails: '<'
    },
    controllerAs: 'dvm',
    controller: classCardsComponentCtrl
};

classCardsComponentCtrl.$inject = ['discoverStateService', 'exploreService', 'utilService', 'prefixes', 'policyEnforcementService'];

function classCardsComponentCtrl(discoverStateService: DiscoverStateService, exploreService, utilService, prefixes, policyEnforcementService) {
    const dvm = this;
    const ds = discoverStateService;
    const es = exploreService;
    const util = utilService;
    const pep = policyEnforcementService;

    dvm.$onInit = function() {
        dvm.chunks = getChunks(dvm.classDetails);
    }
    dvm.$onChanges = function() {
        dvm.chunks = getChunks(dvm.classDetails);
    }
    dvm.exploreData = function(item) {
        const pepRequest = {
            resourceId: ds.explore.recordId,
            actionId: prefixes.policy + 'Read'
        };
        pep.evaluateRequest(pepRequest)
            .then(response => {
                const canRead = response !== pep.deny;
                if (canRead) {
                    es.getClassInstanceDetails(ds.explore.recordId, item.classIRI, {offset: 0, limit: ds.explore.instanceDetails.limit})
                        .then(response => {
                            ds.explore.classId = item.classIRI;
                            ds.explore.classDeprecated = item.deprecated;
                            ds.resetPagedInstanceDetails();
                            merge(ds.explore.instanceDetails, es.createPagedResultsObject(response));
                            ds.explore.breadcrumbs.push(item.classTitle);
                        }, util.createErrorToast);
                } else {
                    util.createErrorToast('You don\'t have permission to read dataset');
                    ds.resetPagedInstanceDetails()
                    ds.explore.classDetails = [];
                    ds.explore.hasPermissionError = true;
                }
            }, () => {
                util.createWarningToast('Could not retrieve record permissions');
            });
    }

    function getChunks(data) {
        return chunk(orderBy(data, ['instancesCount', 'classTitle'], ['desc', 'asc']), 3);
    }
}

export default classCardsComponent;
