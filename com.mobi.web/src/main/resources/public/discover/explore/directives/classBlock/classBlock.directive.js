(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name classBlock
         *
         * @description
         * The `classBlock` module only provides the `classBlock` directive which creates
         * the display for the class details associated with a selected dataset.
         */
        .module('classBlock', [])
        /**
         * @ngdoc directive
         * @name classBlock.directive:classBlock
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         *
         * @description
         * HTML contents in the class block which contains the class details associatd with
         * a selected dataset.
         */
        .directive('classBlock', classBlock);

        classBlock.$inject = ['discoverStateService'];

        function classBlock(discoverStateService) {
            return {
                restrict: 'E',
                templateUrl: 'discover/explore/directives/classBlock/classBlock.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    this.ds = discoverStateService;
                }
            }
        }
})();