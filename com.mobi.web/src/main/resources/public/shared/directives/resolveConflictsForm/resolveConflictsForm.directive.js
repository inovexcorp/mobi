/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

    resolveConflictsForm.$inject = ['utilService'];

    function resolveConflictsForm(utilService) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'shared/directives/resolveConflictsForm/resolveConflictsForm.directive.html',
            scope: {},
            bindToController: {
                conflicts: '<',
                branchTitle: '<',
                targetTitle: '<'
            },
            controllerAs: 'dvm',
            controller: ['$scope', function($scope) {
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
            }]
        }
    }

    angular
        .module('resolveConflictsForm', [])
        .directive('resolveConflictsForm', resolveConflictsForm);
})();
