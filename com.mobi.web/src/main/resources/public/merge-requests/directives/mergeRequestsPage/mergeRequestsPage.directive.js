(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mergeRequestsPage
         *
         * @description
         * The `mergeRequestsPage` module only provides the `mergeRequestsPage` directive
         * which creates the main div containing the Merge Requests page.
         */
        .module('mergeRequestsPage', [])
        /**
         * @ngdoc directive
         * @name mergeRequestsPage.directive:mergeRequestsPage
         * @scope
         * @restrict E
         * @requires mergeRequestsState.service:mergeRequestsStateService
         *
         * @description
         * `mergeRequestsPage` is a directive which creates a div containing the main parts of the Merge Requests
         * tool. The main parts of the page are the {@link mergeRequestList.directive:mergeRequestList},
         * {@link mergeRequestView.directive:mergeRequestView}, and
         * {@link createRequest.directive:createRequest createRequest page}. The directive is replaced by the contents
         * of its template.
         */
        .directive('mergeRequestsPage', mergeRequestsPage);

    mergeRequestsPage.$inject = ['mergeRequestsStateService'];

    function mergeRequestsPage(mergeRequestsStateService) {
        return {
            restrict: 'E',
            templateUrl: 'merge-requests/directives/mergeRequestsPage/mergeRequestsPage.directive.html',
            replace: true,
            scope: {},
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                dvm.state = mergeRequestsStateService;
            }
        }
    }
})();