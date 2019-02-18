(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mergeRequestTabset
         *
         * @description
         * The `mergeRequestTabset` module only provides the `mergeRequestTabset` component
         * which creates a {@link materialTabset.directive:materialTabset} with tabs related to the discussion and
         * difference of a Merge Request.
         */
        .module('mergeRequestTabset', [])
        /**
         * @ngdoc component
         * @name mergeRequestTabset.component:mergeRequestTabset
         *
         * @description
         * `mergeRequestTabset` is a component which creates a div containing a
         * {@link materialTabset.directive:materialTabset tabset} with tabs for the
         * {@link mergeRequestDiscussion.directive:mergeRequestDiscussion},
         * {@link commitChangesDisplay.directive:commitChangesDisplay changes}, and
         * {@link commitHistoryTable.directive:commitHistoryTable commits} of the provided Merge Request.
         *
         * @param {Object} request An object representing a Merge Request
         */
        .component('mergeRequestTabset', {
            bindings: {
                request: '=',
            },
            controllerAs: 'dvm',
            controller: MergeRequestTabsetController,
            templateUrl: 'merge-requests/directives/mergeRequestTabset/mergeRequestTabset.component.html',
        });

    function MergeRequestTabsetController() {
        var dvm = this;
        dvm.tabs = {
            discussion: true,
            changes: false,
            commits: false
        };
    }
})();