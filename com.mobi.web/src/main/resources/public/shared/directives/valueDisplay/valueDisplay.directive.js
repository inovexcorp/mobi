(function() {
    'use strict';

    valueDisplay.$inject = ['discoverStateService', 'utilService'];

    function valueDisplay(discoverStateService, utilService) {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            bindToController: {
                value: '<',
                highlightText: '<'
            },
            templateUrl: 'shared/directives/valueDisplay/valueDisplay.directive.html',
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                dvm.util = utilService;
                dvm.ds = discoverStateService;

                dvm.has = function(obj, key) {
                    return _.has(obj, key);
                }
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name valueDisplay
         *
         * @description
         * The `valueDisplay` module only provides the `valueDisplay` directive which creates
         * a span element which displays a json-ld object in a readable format.
         */
        .module('valueDisplay', [])
        /**
         * @ngdoc directive
         * @name valueDisplay.directive:valueDisplay
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         * @requires util.service:utilService
         *
         * @description
         * `valueDisplay` is a directive which creates a span element for displaying json-ld values.
         * It is meant to be used to display a json-ld object in a readable format.
         *
         * @param {object} value the json-ld value to display to a user.
         */
        .directive('valueDisplay', valueDisplay);
})();
