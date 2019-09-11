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
import { concat, forEach, find, some } from 'lodash';

const template = require('./resolveConflictsBlock.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:resolveConflictsBlock
 * @requires shared.service:utilService
 * @requires shared.service:ontologyStateService
 *
 * @description
 * `resolveConflictsBlock` is a component that creates a series of displays for resolving conflicts between the
 * current branch of the opened {@link shared.service:ontologyStateService ontology} into a target
 * branch. The display includes information about the branches being merged, a
 * {@link shared.component:resolveConflictsForm}, a button to submit the merge, and a button to
 * cancel the merge. The component calls the appropriate methods to merge with the selected resolutions from
 * the `resolveConflictsForm`.
 */
const resolveConflictsBlockComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: resolveConflictsBlockComponentCtrl
};

resolveConflictsBlockComponentCtrl.$inject = ['utilService', 'ontologyStateService'];

function resolveConflictsBlockComponentCtrl(utilService, ontologyStateService) {
    var dvm = this;
    dvm.os = ontologyStateService;
    dvm.util = utilService;
    dvm.error = '';
    dvm.branchTitle = '';
    dvm.targetTitle = '';

    dvm.$onInit = function() {
        var branch = find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId});
        dvm.branchTitle = dvm.util.getDctermsValue(branch, 'title');
        dvm.targetTitle = dvm.util.getDctermsValue(dvm.os.listItem.merge.target, 'title');
    }
    dvm.allResolved = function() {
        return !some(dvm.os.listItem.merge.conflicts, {resolved: false});
    }
    dvm.submit = function() {
        dvm.os.listItem.merge.resolutions = {
            additions: [],
            deletions: []
        };
        forEach(dvm.os.listItem.merge.conflicts, conflict => {
            if (conflict.resolved === 'left') {
                addToResolutions(conflict.right);
            } else if (conflict.resolved === 'right') {
                addToResolutions(conflict.left);
            }
        });
        dvm.os.merge()
            .then(() => {
                dvm.os.resetStateTabs();
                dvm.util.createSuccessToast('Your merge was successful with resolutions.');
                dvm.os.cancelMerge();
            }, error => dvm.error = error);
    }

    function addToResolutions(notSelected) {
        if (notSelected.additions.length) {
            dvm.os.listItem.merge.resolutions.deletions = concat(dvm.os.listItem.merge.resolutions.deletions, notSelected.additions);
        } else {
            dvm.os.listItem.merge.resolutions.additions = concat(dvm.os.listItem.merge.resolutions.additions, notSelected.deletions);
        }
    }
}

export default resolveConflictsBlockComponent;