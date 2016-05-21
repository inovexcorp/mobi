(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name file-input
         *
         * @description 
         * The `file-input` module only provides the `fileInput` directive which
         * adds ngModel functionality to the standard input element for files. 
         */
        .module('file-input', [])
        /**
         * @ngdoc directive
         * @name file-input.directive:fileInput
         * @restrict E
         *
         * @description 
         * `fileInput` is a directive that creates a input element of type file
         * that supports ngModel. The file chosen using the directive is returned 
         * as an object.
         *
         * @usage
         * <file-input ng-model="someVariable"></file-input>
         */
        .directive('fileInput', fileInput);

    fileInput.$inject = ['$parse'];

        function fileInput($parse) {
            function link(scope, element, attrs) {
                var modelGet = $parse(attrs.ngModel),
                    modelSet = modelGet.assign,
                    onChange = $parse(attrs.onChange),
                    updateModel = function() {
                        scope.$apply(function() {
                            modelSet(scope, element[0].files[0]);
                            onChange(scope);
                        });
                    };
                element.bind('change', updateModel);
            }

            return {
                restrict: 'E',
                template: '<input type="file" />',
                replace: true,
                link: link
            };
        }
})();
