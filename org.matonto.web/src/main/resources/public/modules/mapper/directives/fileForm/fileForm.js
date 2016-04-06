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
                    delimitedFile: '=',
                    separator: '=',
                    containsHeaders: '='
                },
                controller: function() {
                    var dvm = this;
                    if (dvm.delimitedFile) {
                        dvm.uploaded = true;
                    }

                    dvm.isExcel = function() {
                        var fileName = _.get(dvm.delimitedFile, 'name');
                        return _.includes(fileName, 'xls');
                    }
                },
                templateUrl: 'modules/mapper/directives/fileForm/fileForm.html'
            }
        }
})();
