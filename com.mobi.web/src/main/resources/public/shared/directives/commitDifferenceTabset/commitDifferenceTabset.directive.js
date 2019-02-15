/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

    angular
        /**
         * @ngdoc overview
         * @name commitDifferenceTabset
         *
         * @description
         * The `commitDifferenceTabset` module only provides the `commitDifferenceTabset` directive
         * which creates a {@link tabset.directive:tabset} with tabs related to the difference between
         * two commits.
         */
        .module('commitDifferenceTabset', [])
        /**
         * @ngdoc directive
         * @name commitDifferenceTabset.directive:commitDifferenceTabset
         * @scope
         * @restrict E
         *
         * @description
         * `commitDifferenceTabset` is a directive which creates a div containing a
         * {@link tabset.directive:tabset} with tabs for the
         * {@link commitChangesDisplay.directive:commitChangesDisplay changes} and
         * {@link commitHistoryTable.directive:commitHistoryTable commits} between two branches.
         * The directive is replaced by the contents of its template.
         *
         * @param {string} recordId The IRI of the VersionedRDFRecord that the Commits belong to
         * @param {Object} sourceBranch The JSON-LD of the source branch of the difference
         * @param {string} targetBranchId The IRI of the target branch of the difference
         * @param {Object} difference The object representing the difference between the two Commits
         */
        .directive('commitDifferenceTabset', commitDifferenceTabset);

    function commitDifferenceTabset() {
        return {
            restrict: 'E',
            templateUrl: 'shared/directives/commitDifferenceTabset/commitDifferenceTabset.directive.html',
            replace: true,
            scope: {},
            bindToController: {
                branchTitle: '<',
                commitId: '<',
                targetId: '<',
                difference: '<'
            },
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                dvm.tabs = {
                    changes: true,
                    commits: false
                };
            }
        }
    }
})();