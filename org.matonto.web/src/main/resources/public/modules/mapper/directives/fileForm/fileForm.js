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
                scope: {
                    onUploadClick: '&',
                    onContinueClick: '&'
                },
                bindToController: {
                    delimitedFile: '=ngModel',
                    separator: '=',
                    containsHeaders: '='
                },
                controller: function() {
                    var dvm = this;
                    if (dvm.delimitedFile) {
                        dvm.uploaded = true;
                    }
                },
                templateUrl: 'modules/mapper/directives/fileForm/fileForm.html'
            }
        }
})();
