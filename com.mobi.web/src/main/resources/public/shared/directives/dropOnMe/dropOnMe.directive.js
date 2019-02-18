(function() {
    'use strict';
        
    dropOnMe.$inject = ['$timeout'];

    function dropOnMe($timeout) {
        return {
            restrict: 'A',
            scope: {
                dropId: '<',
                onDrop: '&'
            },
            link: function(scope, elem) {
                elem.on('dragover', event => {
                    if (_.includes(event.dataTransfer.types, scope.dropId)) {
                        event.preventDefault();
                        elem.addClass('drop-hover');
                    }
                });
                elem.on('drop', event => {
                    var data = event.dataTransfer.getData(scope.dropId);
                    if (data) {
                        $timeout(function() {
                            event.preventDefault();
                            scope.onDrop({data: JSON.parse(data)});
                        });
                    }
                    elem.removeClass('drop-hover');
                });
                elem.on('dragleave', event => {
                    elem.removeClass('drop-hover');
                });
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name dropOnMe
         *
         * @description
         * The `dropOnMe` module provides the `dropOnMe` directive which provides a way to drop an element on this element.
         */
        .module('dropOnMe', [])
        /**
         * @ngdoc directive
         * @name dropOnMe.directive:dropOnMe
         * @restrict A
         *
         * @description
         * `dropOnMe` is a directive that allows users to drop on this element. This should be used in tandem with the `dragMe`
         * directive. The "dropId" attribute is a unique identifier to match up to a "dragId" which allows dropping the dragged
         * element on this element. The "onDrop" attribute is a function that will be executed with the "data" provided by the
         * dragged element.
         */
        .directive('dropOnMe', dropOnMe);
})();