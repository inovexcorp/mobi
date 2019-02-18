(function() {
    'use strict';

    pagination.$inject = ['$timeout']

    function pagination($timeout) {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            bindToController: {
                currentPage: '=',
                getPage: '&',
                total: '<',
                limit: '<'
            },
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;

                dvm.changePage = function() {
                    $timeout(() => dvm.getPage());
                }
            },
            templateUrl: 'shared/directives/pagination/pagination.directive.html'
        }
    }

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
         * 'pagination' ul for paginated results returned from HTTP calls. The directive will automatically
         * update the `currentPage` value when directional buttons are clicked. The `getPage` function is
         * called after the `currentPage` value changes. It also uses the provided `total` and `limit` values
         * to show the correct numebr of pages. The directive is replaced by the content of the template.
         *
         * @param {number} currentPage the index of the current page (1 based)
         * @param {function} getPage the function to be called when a pagination link is clicked
         * @param {number} total the total number of results
         * @param {limit} limit the limit on the number of items per page
         */
        .directive('pagination', pagination);
})();
