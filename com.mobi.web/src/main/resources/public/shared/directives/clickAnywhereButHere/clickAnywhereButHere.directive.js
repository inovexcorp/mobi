(function() {
    'use strict';

    clickAnywhereButHereService.$inject = ['$document'];

    function clickAnywhereButHereService($document) {
        var tracker = [];

        return function($scope, expr) {
            var t = _.find(tracker, tr => tr.expr === expr && tr.scope === $scope);
            if (t) {
                return t;
            }
            var handler = function() {
                $scope.$apply(expr);
            };
            $document.on('click', handler);

            // IMPORTANT! Tear down this event handler when the scope is destroyed.
            $scope.$on('$destroy', function() {
                $document.off('click', handler);
            });

            t = { scope: $scope, expr };
            tracker.push(t);
            return t;
        };
    }

    clickAnywhereButHere.$inject = ['clickAnywhereButHereService'];

    function clickAnywhereButHere(clickAnywhereButHereService) {
        return {
            restrict: 'A',
            link: function(scope, elem, attr, ctrl) {
                var handler = function(e) {
                    e.stopPropagation();
                };
                elem.on('click', handler);

                scope.$on('$destroy', function() {
                    elem.off('click', handler);
                });

                clickAnywhereButHereService(scope, attr.clickAnywhereButHere);
            }
        };
    }

    angular
        /**
         * @ngdoc overview
         * @name clickAnywhereButHere
         *
         * @description
         * The `clickAnywhereButHere` module provides the `clickAnywhereButHereService` factory and the
         * `clickAnywhereButHere` directive which together provide a way to call a function when a user
         * clicks off of an element.
         */
        .module('clickAnywhereButHere', [])
        /**
         * @ngdoc service
         * @name clickAnywhereButHereService.service:clickAnywhereButHereService
         * @requires $document
         *
         * @description
         * `clickAnywhereButHereService` is a service that attaches a click handler to the document that
         * will call the passed expression for the passed scope if there isn't already a handler attached
         * for that scope. When the scope is destroyed that click handler will be removed.
         *
         * @param {Function} $scope The scope to call the passed expression within
         * @param {*} expr The expression to evaluate when the document is clicked
         */
        .factory('clickAnywhereButHereService', clickAnywhereButHereService)
        /**
         * @ngdoc directive
         * @name clickAnywhereButHere.directive:clickAnywhereButHere
         * @restrict A
         * @requires clickAnywhereButHereService.service:clickAnywhereButHereService
         *
         * @description
         * `clickAnywhereButHere` is a directive that creates a click handler for the parent element such
         * that the click event does not propogate and calls the
         * {@link clickAnywhereButHereService.service:clickAnywhereButHereService clickAnywhereButHereService}
         * attaching a click handler to the document to call the passed expression from the directive.
         */
        .directive('clickAnywhereButHere', clickAnywhereButHere);
})();