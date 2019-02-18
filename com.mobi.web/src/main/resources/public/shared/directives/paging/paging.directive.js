(function() {
    'use strict';

    paging.$inject = ['$timeout']

    function paging($timeout) {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            bindToController: {
                total: '<',
                currentPage: '=',
                limit: '<',
                changeEvent: '&'
            },
            controllerAs: 'dvm',
            controller: ['$scope', function($scope) {
                var dvm = this;
                $scope.Math = window.Math;

                dvm.onChange = function() {
                    $timeout(function() {
                        dvm.changeEvent();
                    });
                }
            }],
            templateUrl: 'shared/directives/paging/paging.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name paging
         *
         * @description
         * The `paging` module only provides the `paging` directive which creates a div element with pagination buttons
         * and details about which page a user is currently on.
         */
        .module('paging', [])
        /**
         * @ngdoc directive
         * @name paging.directive:paging
         * @scope
         * @restrict E
         *
         * @description
         * `paging` is a directive that creates a div element with a `uib-pagination` and soem text describing the
         * current page of the pagination. The display states which items are showing as well as the total. The
         * pagination begins at the provided 1-based index of a page. The directive will automatically update the
         * `currentPage` value when directional buttons are clicked. A function can be provided to be called after the
         * current page changes. The directive is replaced by the content of the template.
         *
         * @param {number} total The total number of results
         * @param {number} currentPage The index of the current page (1 based)
         * @param {limit} limit The limit on the number of items per page
         * @param {function} changeEvent the function to be called when a directional button is clicked
         */
        .directive('paging', paging);
})();
