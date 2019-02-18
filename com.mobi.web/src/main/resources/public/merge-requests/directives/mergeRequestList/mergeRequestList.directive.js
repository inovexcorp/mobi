(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mergeRequestList
         *
         * @description
         * The `mergeRequestList` module only provides the `mergeRequestList` directive which creates a div
         * with a {@link block.directive:block} with a list of MergeRequests.
         */
        .module('mergeRequestList', [])
        /**
         * @ngdoc directive
         * @name mergeRequestList.directive:mergeRequestList
         * @scope
         * @restrict E
         * @requires mergeRequestsState.service:mergeRequestsStateService
         * @requires modal.service:modalService
         *
         * @description
         * `mergeRequestList` is a directive which creates a div containing a {@link block.directive:block}
         * with the list of MergeRequests retrieved by the
         * {@link mergeRequestsState.service:mergeRequestsStateService}. The directive houses the method for opening a
         * modal for deleting merge requests. The directive is replaced by the contents of its template.
         */
        .directive('mergeRequestList', mergeRequestList);

        mergeRequestList.$inject = ['mergeRequestsStateService', 'modalService'];

        function mergeRequestList(mergeRequestsStateService, modalService) {
            return {
                restrict: 'E',
                templateUrl: 'merge-requests/directives/mergeRequestList/mergeRequestList.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.filterOptions = [
                        {value: false, label: 'Open'},
                        {value: true, label: 'Accepted'}
                    ];
                    dvm.state = mergeRequestsStateService;

                    dvm.state.setRequests(dvm.state.acceptedFilter);

                    dvm.showDeleteOverlay = function(request, event) {
                        event.stopPropagation();
                        modalService.openConfirmModal('<p>Are you sure you want to delete ' + request.title + '?</p>', () => dvm.state.deleteRequest(request));
                    }
                }
            }
        }
})();