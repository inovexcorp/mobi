(function() {
    'use strict';

    function searchBar() {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            bindToController: {
                bindModel: '=ngModel',
                submitEvent: '&'
            },
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;

                dvm.onKeyUp = function(event) {
                    if (event.keyCode === 13) {
                        dvm.submitEvent();
                    }
                }
            },
            templateUrl: 'shared/directives/searchBar/searchBar.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name searchBar
         *
         * @description
         * The `searchBar` module only provides the `searchBar` directive which creates an `.input-group` with a search
         * input.
         */
        .module('searchBar', [])
        /**
         * @ngdoc directive
         * @name searchBar.directive:searchBar
         * @scope
         * @restrict E
         *
         * @description
         * `searchBar` is a directive that creates an '.input-group' div element with an input for searching a list of
         * items. The search will be submitted when the enter button is clicked. The directive takes a function to be
         * called when the search is submitted. The directive is replaced by the content of the template.
         *
         * @param {string} bindModel The contents of the search input
         * @param {function} submitEvent The function to be called when the enter button is clicked
         */
        .directive('searchBar', searchBar);
})();
