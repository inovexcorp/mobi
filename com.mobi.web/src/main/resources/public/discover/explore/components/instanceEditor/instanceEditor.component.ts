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
import { find } from 'lodash';

import './instanceEditor.component.scss';

const template = require('./instanceEditor.component.html');

/**
 * @ngdoc component
 * @name explore.component:instanceEditor
 * @requires $q
 * @requires shared.service:discoverStateService
 * @requires shared.service:utilService
 * @requires discover.service:exploreService
 * @requires explore.service:exploreUtilsService
 *
 * @description
 * `instanceEditor` is a component that displays {@link shared.component:breadCrumbs} to the class of the instance being edited.
 * It also provides an {@link explore.component:instanceForm} to show the complete list of properties
 * available for the new instance in an editable format along with save and cancel buttons for the editing.
 */
const instanceEditorComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: instanceEditorComponentCtrl
};

instanceEditorComponentCtrl.$inject = ['$q', 'discoverStateService', 'utilService', 'exploreService', 'exploreUtilsService', 'prefixes', 'policyEnforcementService'];

function instanceEditorComponentCtrl($q, discoverStateService, utilService, exploreService, exploreUtilsService,  prefixes, policyEnforcementService) {
    const dvm = this;
    const es = exploreService;
    const eu = exploreUtilsService;
    const pep = policyEnforcementService;
    dvm.ds = discoverStateService;
    dvm.util = utilService;
    dvm.isValid = true;

    dvm.save = function() {
        const pepRequest = {
            resourceId: dvm.ds.explore.recordId,
            actionId: prefixes.catalog + 'Modify'
        };
        pep.evaluateRequest(pepRequest)
            .then(response => {
                const canModify = response !== pep.deny;
                if (canModify) {
                    dvm.ds.explore.instance.entity = eu.removeEmptyPropertiesFromArray(dvm.ds.explore.instance.entity);
                    const instance = dvm.ds.getInstance();
                    es.updateInstance(dvm.ds.explore.recordId, dvm.ds.explore.instance.metadata.instanceIRI, dvm.ds.explore.instance.entity)
                        .then(() => es.getClassInstanceDetails(dvm.ds.explore.recordId, dvm.ds.explore.classId, {offset: (dvm.ds.explore.instanceDetails.currentPage - 1) * dvm.ds.explore.instanceDetails.limit, limit: dvm.ds.explore.instanceDetails.limit}), $q.reject)
                        .then(response => {
                            dvm.ds.explore.instanceDetails.data = response.data;
                            dvm.ds.explore.instance.metadata = find(response.data, {instanceIRI: instance['@id']});
                            dvm.ds.explore.breadcrumbs[dvm.ds.explore.breadcrumbs.length - 1] = dvm.ds.explore.instance.metadata.title;
                            dvm.ds.explore.editing = false;
                        }, dvm.util.createErrorToast);
                } else {
                    utilService.createErrorToast('You don\'t have permission to modify dataset');
                    dvm.cancel();
                }
            }, () => {
                utilService.createWarningToast('Could not retrieve record permissions');
            });
    }
    dvm.cancel = function() {
        dvm.ds.explore.instance.entity = dvm.ds.explore.instance.original;
        dvm.ds.explore.editing = false;
    }
}

export default instanceEditorComponent;
