(function() {
    'use strict';

    fileInput.$inject = ['$parse'];

    function fileInput($parse) {
        return {
            restrict: 'E',
            template: '<input type="file" />',
            replace: true,
            link: function(scope, element, attrs) {
                var modelSet = $parse(attrs.ngModel).assign;
                var onChange = $parse(attrs.onChange);
                var isMulti = _.has(attrs, 'multiple');

                if (isMulti) {
                    element.attr('multiple', true);
                }

                element.bind('change', () => {
                    scope.$apply(function() {
                        var files = element[0].files;
                        modelSet(scope, isMulti ? _.toArray(files) : files[0]);
                        onChange(scope);
                    });
                    element.val(null);
                });
            }
        };
    }

    angular
        /**
         * @ngdoc overview
         * @name file-input
         *
         * @description
         * The `fileInput` module only provides the `fileInput` directive which
         * adds ngModel functionality to the standard input element for files.
         */
        .module('fileInput', [])
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
})();
