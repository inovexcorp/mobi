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
     *
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
