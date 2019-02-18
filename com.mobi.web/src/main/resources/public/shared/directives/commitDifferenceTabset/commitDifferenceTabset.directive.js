(function() {
    'use strict';

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
})();