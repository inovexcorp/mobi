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
