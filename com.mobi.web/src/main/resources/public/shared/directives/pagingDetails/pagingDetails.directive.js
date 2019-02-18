(function() {
    'use strict';

    function pagingDetails() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                totalSize: '<',
                pageIndex: '<',
                limit: '<'
            },
            controller: ['$scope', function($scope) {
                $scope.Math = window.Math;
            }],
            templateUrl: 'shared/directives/pagingDetails/pagingDetails.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name pagingDetails
         *
         * @description
         * The `pagingDetails` module only provides the `pagingDetails` directive which creates a div element
         * with description of a page of results.
         */
        .module('pagingDetails', [])
        /**
         * @ngdoc directive
         * @name pagingDetails.directive:pagingDetails
         * @scope
         * @restrict E
         *
         * @description
         * `pagingDetails` is a directive that creates a div element with a p containing a phrase describing
         * a page of results based on the passed total size, page index, and limit of results per page. The
         * directive is replaced by the content of the template.
         *
         * @param {number} totalSize The total number of results
         * @param {number} pageIndex The index of the current page
         * @param {number} limit The limit on the numebr of results per page
         */
        .directive('pagingDetails', pagingDetails);

})();
