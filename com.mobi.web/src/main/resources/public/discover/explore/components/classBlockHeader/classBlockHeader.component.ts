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
import './classBlockHeader.component.scss';

const template = require('./classBlockHeader.component.html');

/**
 * @ngdoc component
 * @name explore.component:classBlockHeader
 * @requires shared.service:discoverStateService
 * @requires discover.service:exploreService
 * @requires explore.service:exploreUtilsService
 * @requires shared.service:utilService
 * @requires shared.service:modalService
 * @requires shared.service:prefixes
 * @requires shared.service:policyEnforcementService
 *
 * @description
 * `classBlockHeader` is a component that creates a {@link discover.component:datasetSelect} to select a dataset to explore.
 * It also provides buttons to refresh the view of the dataset and to create an instance.
 */
const classBlockHeaderComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: classBlockHeaderComponentCtrl
};

classBlockHeaderComponentCtrl.$inject = ['discoverStateService', 'exploreService', 'exploreUtilsService', 'utilService', 'modalService', 'prefixes', 'policyEnforcementService'];

function classBlockHeaderComponentCtrl(discoverStateService, exploreService, exploreUtilsService, utilService, modalService, prefixes, policyEnforcementService) {
    const dvm = this;
    const es = exploreService;
    const util = utilService;
    const pep = policyEnforcementService;
    dvm.ds = discoverStateService;
    dvm.eu = exploreUtilsService;
    
    dvm.showCreate = function() {
        const pepRequest = {
            resourceId: dvm.ds.explore.recordId,
            actionId: prefixes.catalog + 'Modify'
        };
        pep.evaluateRequest(pepRequest)
            .then(response => {
                const canEdit = response !== pep.deny;
                if (canEdit) {
                    dvm.eu.getClasses(dvm.ds.explore.recordId)
                        .then(classes => {
                            modalService.openModal('newInstanceClassOverlay', {classes});
                        }, util.createErrorToast);
                } else {
                    util.createErrorToast('You don\'t have permission to modify dataset');
                }
            }, () => {
                util.createWarningToast('Could not retrieve record permissions');
            });
    }
    dvm.onSelect = function(value) {
        dvm.ds.explore.recordId = value;
        if (dvm.ds.explore.recordId !== '') {
            dvm.refresh();
        }
    }
    dvm.refresh = function() {
        const pepRequest = {
            resourceId: dvm.ds.explore.recordId,
            actionId: prefixes.policy + 'Read'
        };
        pep.evaluateRequest(pepRequest)
            .then(response => {
                const canRead = response !== pep.deny;
                if (canRead) {
                    dvm.ds.explore.hasPermissionError = false;
                    es.getClassDetails(dvm.ds.explore.recordId)
                        .then(details => {
                            dvm.ds.explore.classDetails = details;
                        }, errorMessage => {
                            dvm.ds.explore.classDetails = [];
                            util.createErrorToast(errorMessage);
                        });
                } else {
                    util.createErrorToast('You don\'t have permission to read dataset');
                    dvm.ds.explore.recordId = '';
                    dvm.ds.explore.breadcrumbs = ['Classes'];
                    dvm.ds.explore.hasPermissionError = true;
                }
            }, () => {
                util.createWarningToast('Could not retrieve record permissions');
            });
    }
}

export default classBlockHeaderComponent;
