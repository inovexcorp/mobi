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
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name shared.component:commitDifferenceTabset
     *
     * @description
     * `commitDifferenceTabset` is a directive which creates a div containing a {@link shared.directive:tabset} with
     * tabs for the {@link shared.directive:commitChangesDisplay changes} and
     * {@link shared.directive:commitHistoryTable commits} between two branches.
     *
     * @param {string} recordId The IRI of the VersionedRDFRecord that the Commits belong to
     * @param {Object} sourceBranch The JSON-LD of the source branch of the difference
     * @param {string} targetBranchId The IRI of the target branch of the difference
     * @param {Object} difference The object representing the difference between the two Commits
     */
    const commitDifferenceTabsetComponent = {
        templateUrl: 'shared/components/commitDifferenceTabset/commitDifferenceTabset.component.html',
        bindings: {
            branchTitle: '<',
            commitId: '<',
            targetId: '<',
            difference: '<'
        },
        controllerAs: 'dvm',
        controller: commitDifferenceTabsetComponentCtrl
    };

    function commitDifferenceTabsetComponentCtrl() {
        var dvm = this;
        dvm.tabs = {
            changes: true,
            commits: false
        };
    }

    angular.module('shared')
        .component('commitDifferenceTabset', commitDifferenceTabsetComponent);
})();