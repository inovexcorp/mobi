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

import { get } from 'lodash';

const template = require('./commitDifferenceTabset.component.html');

/**
 * @ngdoc component
 * @name shared.component:commitDifferenceTabset
 *
 * @description
 * `commitDifferenceTabset` is a directive which creates a div containing a {@link shared.component:tabset} with
 * tabs for the {@link shared.component:commitChangesDisplay changes} and
 * {@link shared.component:commitHistoryTable commits} between two branches.
 *
 * @param {string} recordId The IRI of the VersionedRDFRecord that the Commits belong to
 * @param {Object} sourceBranch The JSON-LD of the source branch of the difference
 * @param {string} targetBranchId The IRI of the target branch of the difference
 * @param {Object} difference The object representing the difference between the two Commits
 * @param {Function} entityNameFunc An optional function to pass to `commitChangesDisplay` to control the display of
 * each entity's name
 */
const commitDifferenceTabsetComponent = {
    template,
    bindings: {
        branchTitle: '<',
        commitId: '<',
        targetId: '<',
        difference: '<',
        entityNameFunc: '<?'
    },
    controllerAs: 'dvm',
    controller: commitDifferenceTabsetComponentCtrl
};

commitDifferenceTabsetComponentCtrl.$inject = ['catalogManagerService', 'utilService'];

function commitDifferenceTabsetComponentCtrl(catalogManagerService, utilService) {
    var dvm = this;

    dvm.cm = catalogManagerService;
    dvm.util = utilService;
    dvm.additions = {};
    dvm.deletions = {};
    dvm.hasMoreResults = false;
    dvm.tabs = {
        changes: true,
        commits: false
    };

    dvm.$onChanges = function(changesObj) {
        // Technically when this component is created it doesn't have a difference until the getDifference REST endpoint completes
        if (changesObj.difference && dvm.difference) { 
            dvm.setInitialDifference()
        }
    }

    dvm.setInitialChangesTab = function(value) { // When switching back to this tab we need to reset dvm.additions and dvm.deletions because they only have the current page
        dvm.setInitialDifference();
        dvm.tabs.changes = value;
    }

    dvm.setInitialDifference = function() {
        dvm.additions = dvm.difference.additions;
        dvm.deletions = dvm.difference.deletions;
        dvm.hasMoreResults = dvm.difference.hasMoreResults;
    }

    dvm.retrieveMoreResults = function(limit, offset) {
        dvm.cm.getDifference(dvm.commitId, dvm.targetId, limit, offset)
            .then(response => {
                dvm.additions = response.data.additions;
                dvm.deletions = response.data.deletions;
                var headers = response.headers();
                dvm.hasMoreResults = get(headers, 'has-more-results', false) === 'true';
            }, errorMessage => {
                if (errorMessage) {
                    dvm.util.createErrorToast(errorMessage);
                }
            });
    }
}

export default commitDifferenceTabsetComponent;