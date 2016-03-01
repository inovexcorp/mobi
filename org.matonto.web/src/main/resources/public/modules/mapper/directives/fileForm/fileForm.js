(function() {
    'use strict';

    angular
        .module('fileForm', [])
        .directive('fileForm', fileForm);

        function fileForm() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                bindToController: {
                    delimitedFile: '=ngModel',
                    separator: '=',
                    containsHeaders: '='
                },
                scope: {
                    onUploadClick: '&',
                    onContinueClick: '&'
                },
                controller: function() {
                    var dvm = this;
                },
                templateUrl: 'modules/mapper/directives/fileForm/fileForm.html'
            }
        }
})();
