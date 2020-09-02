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
import { get, reject, find } from 'lodash';

import './mergeBlock.component.scss';

const template = require('./mergeBlock.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:mergeBlock
 * @requires shared.service:utilService
 * @requires shared.service:ontologyStateService
 * @requires shared.service:catalogManagerService
 *
 * @description
 * `mergeBlock` is a component that creates a form for merging the current branch of the opened
 * {@link shared.service:ontologyStateService ontology} into another branch. The form contains a
 * {@link shared.component:branchSelect} for the target branch, a {@link shared.component:checkbox} for indicating
 * whether the source branch should be removed after the merge, a button to submit the merge, and a button to cancel
 * the merge. Once a target is selected, a {@link shared.component:commitDifferenceTabset} is displayed. The form
 * calls the appropriate methods to check for conflicts before performing the merge. 
 */
const mergeBlockComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: mergeBlockComponentCtrl
};

mergeBlockComponentCtrl.$inject = ['utilService', 'ontologyStateService', 'catalogManagerService', '$q'];

function mergeBlockComponentCtrl(utilService, ontologyStateService, catalogManagerService, $q) {
    var dvm = this;
    var cm = catalogManagerService;
    dvm.os = ontologyStateService;
    dvm.util = utilService;

    var catalogId = '';
    dvm.error = '';
    dvm.branches = [];
    dvm.branchTile = '';
    dvm.targetHeadCommitId = undefined;        

    dvm.$onInit = function() {
        catalogId = get(cm.localCatalog, '@id', '');
        dvm.branches = reject(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId});
        var branch = find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId});
        dvm.branchTitle = dvm.util.getDctermsValue(branch, 'title');

        dvm.changeTarget();
    }
    dvm.changeTarget = function(value) {
        dvm.os.listItem.merge.target = value;
        if (dvm.os.listItem.merge.target) {
            cm.getRecordBranch(dvm.os.listItem.merge.target['@id'], dvm.os.listItem.ontologyRecord.recordId, catalogId)
                .then(target => {
                    dvm.targetHeadCommitId = target["http://mobi.com/ontologies/catalog#head"][0]["@id"];
                    return cm.getDifference(dvm.os.listItem.ontologyRecord.commitId, dvm.targetHeadCommitId, cm.differencePageSize, 0);
                    }, $q.reject)
                .then(response => {
                    dvm.os.listItem.merge.difference = response.data;
                    var headers = response.headers();
                    dvm.os.listItem.merge.difference.hasMoreResults = get(headers, 'has-more-results', false) === 'true';
                }, errorMessage => {
                    dvm.util.createErrorToast(errorMessage);
                    dvm.os.listItem.merge.difference = undefined;
                });
                
        } else {
            dvm.os.listItem.merge.difference = undefined;
        }
    }
    dvm.submit = function() {
        dvm.os.attemptMerge()
            .then(() => {
                dvm.os.resetStateTabs();
                dvm.util.createSuccessToast('Your merge was successful.');
                dvm.os.cancelMerge();
            }, error => dvm.error = error);
    }
}

export default mergeBlockComponent;