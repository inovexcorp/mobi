(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name pagination
         * 
         * @description
         * The `pagination` module only provides the `pagination` directive which
         * creates a div element with a custom Bootstrap 'pagination' ul for 
         * paginated results returned from HTTP calls.
         */
        .module('pagination', [])
        /**
         * @ngdoc directive
         * @name pagination.directive:pagination
         * @scope
         * @restrict E
         *
         * @description 
         * `pagination` is a directive that creates a div element a custom Bootstrap 
         * 'pagination' ul for paginated results returned from HTTP calls. The getPage 
         * function expects a parameter named 'direction' to which it passes back either
         * 'next' or 'prev'. The directive is replaced by the content of the template.
         *
         * @param {Object} links a links object from a paginated result
         * @param {string} links.prev the path for a previous page of results
         * @param {string} links.next the path for a following page of results
         * @param {number} currentPage the index of the current page
         * @param {function} getPage the function to be called when a pagination link 
         * is clicked
         *
         * @usage
         * <!-- With only an icon -->
         * <pagination links="{prev: '', next: ''}" current-page="0", get-page="console.log('Getting page')"></pagination>
         */
        .directive('pagination', pagination);

        function pagination() {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    links: '=',
                    currentPage: '=',
                    getPage: '&'
                },
                templateUrl: 'directives/pagination/pagination.html'
            }
        }
})();
