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
     * @name shared.component:resolveConflictsForm
     *
     * @description
     * `resolveConflictsForm` is a component that creates displays of conflicts from a merge of VersionedRDFRecord
     * branches and ways to resolve those conflicts. The initial view is a list of the conflicts displayed as the entity
     * titles and their resolution statuses. Once a conflict is selected, the view changes to a side-by-side display of
     * the changes from each branch in the conflict. Clicking on one of the displays selects which changes to keep in
     * the resolution. The conflicts should in the form:
     * ```
     * {
     *     iri: '',
     *     resolved: '',
     *     left: {
     *         additions: [],
     *         deletions: []
     *     },
     *     right: {
     *         additions: [],
     *         deletions: []
     *     }
     * }
     * ```
     * 
     * @param {Object[]} conflicts The conflicts to be resolved in the form
     * @param {string} branchTitle The title of the source branch of the merge
     * @param {string} targetTitle The title of the target branch of the merge
     */
    const resolveConflictsFormComponent = {
        templateUrl: 'shared/components/resolveConflictsForm/resolveConflictsForm.component.html',
        bindings: {
            conflicts: '<',
            branchTitle: '<',
            targetTitle: '<'
        },
        controllerAs: 'dvm',
        controller: resolveConflictsFormComponentCtrl
    };

    resolveConflictsFormComponentCtrl.$inject = ['utilService'];

    function resolveConflictsFormComponentCtrl(utilService) {
        var dvm = this;
        dvm.util = utilService;
        dvm.index = undefined;
        dvm.selected = undefined;
        dvm.changes = undefined;

        dvm.select = function(index) {
            dvm.index = index;
            dvm.selected = dvm.conflicts[dvm.index];
            dvm.changes = {
                left: {
                    additions: dvm.util.getChangesById(dvm.selected.iri, dvm.selected.left.additions),
                    deletions: dvm.util.getChangesById(dvm.selected.iri, dvm.selected.left.deletions)
                },
                right: {
                    additions: dvm.util.getChangesById(dvm.selected.iri, dvm.selected.right.additions),
                    deletions: dvm.util.getChangesById(dvm.selected.iri, dvm.selected.right.deletions)
                }
            };
        }
        dvm.hasNext = function() {
            return (dvm.index + 1) < dvm.conflicts.length;
        }
        dvm.backToList = function() {
            dvm.index = undefined;
            dvm.selected = undefined;
            dvm.changes = undefined;
        }
    }

    angular.module('shared')
        .component('resolveConflictsForm', resolveConflictsFormComponent);
})();
