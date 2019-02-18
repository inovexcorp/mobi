(function() {
    'use strict';

    dragFile.$inject = ['$window', '$parse', '$compile'];

    function dragFile($window, $parse, $compile) {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                scope.showDragFileOverlay = false;

                elem.addClass('drag-file-container');
                elem.append($compile('<div ng-show="showDragFileOverlay" class="drag-file position-absolute h-100 w-100"><div class="drag-file-info position-absolute text-center text-white"><span class="fa fa-cloud-upload"></span><div class="p-2 bg-primary">Drop files to upload</div></div></div>')(scope));

                var modelSet = $parse(attrs.dragFile).assign;
                var onDrop = $parse(attrs.onDrop);

                elem.on('dragenter', event => event.preventDefault());
                elem.on('dragover', event => {
                    if (_.get(event.dataTransfer, 'items', []).length) {
                        elem.addClass('hover');
                        scope.$apply(function() {
                            scope.showDragFileOverlay = true;
                        });
                    } else {
                        event.preventDefault();
                    }
                });
                elem.on('drop', event => {
                    event.preventDefault();
                    elem.removeClass('hover');
                    scope.$apply(function() {
                        modelSet(scope, [...event.dataTransfer.files])
                        scope.showDragFileOverlay = false;
                        if (onDrop) {
                            onDrop(scope);
                        }
                    });
                });
                elem.on('dragleave', event => {
                    elem.removeClass('hover');
                    scope.$apply(function() {
                        scope.showDragFileOverlay = false;
                    });
                });

                var windowElem = angular.element($window);
                windowElem.on('dragenter', event => event.preventDefault());
                windowElem.on('dragover', event => event.preventDefault());
                windowElem.on('drop', event => event.preventDefault());

                scope.$on('$destroy', () => {
                    var windowElem = angular.element($window);
                    windowElem.off('dragenter');
                    windowElem.off('dragover');
                    windowElem.off('drop');
                });
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name dragFile
         *
         * @description
         * The `dragFile` module only provides the `dragFile` directive which creates the draggable
         * file section.
         */
        .module('dragFile', [])
        /**
         * @ngdoc directive
         * @name dragFile.directive:dragFile
         * @scope
         * @restrict E
         * @requires $window
         *
         * @description
         * HTML contents in the drag file which provides an area to drop or browse for files.
         *
         * @param {Function} onDrop the function to execute on file drop
         * @param {Object[]} files the list of files that were dropped
         */
        .directive('dragFile', dragFile);
})();