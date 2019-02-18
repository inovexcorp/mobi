(function() {
    'use strict';

    function dragMe() {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                elem.on('dragstart', event => {
                    event.dataTransfer.setData(scope.$eval(attrs.dragId), JSON.stringify(scope.$eval(attrs.info)));
                });
                scope.$watch(() => _.get(attrs, 'disabled'), newValue => {
                    elem.prop('draggable', !newValue);
                });
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name dragMe
         *
         * @description
         * The `dragMe` module provides the `dragMe` directive which provides a way to drag an element.
         */
        .module('dragMe', [])
        /**
         * @ngdoc directive
         * @name dragMe.directive:dragMe
         * @restrict A
         *
         * @description
         * `dragMe` is a directive that allows users to drag the element. It expects attributes "info" and "dragId".
         * The "info" attribute contains whatever you want to pass on when you drop this directive. The "dragId" attribute
         * is a unique identifier to match up to a "dropId" where you can actually drop this directive.
         */
        .directive('dragMe', dragMe);
})();