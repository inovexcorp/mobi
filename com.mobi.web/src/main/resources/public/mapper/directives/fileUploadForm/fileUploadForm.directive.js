(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name fileUploadForm
         *
         * @description
         * The `fileUploadForm` module only provides the `fileUploadForm` directive which creates
         * a form for uploading delimited data into Mobi.
         */
        .module('fileUploadForm', [])
        /**
         * @ngdoc directive
         * @name fileUploadForm.directive:fileUploadForm
         * @scope
         * @restrict E
         * @requires $q
         * @requires delimitedManager.service:delimitedManagerService
         * @requires mapperState.service:mapperStateService
         *
         * @description
         * `fileUploadForm` is a directive that creates a form for uploaded delimited data into Mobi
         * using the {@link delimitedManager.service:delimitedManagerService delimitedManagerService}.
         * If the chosen file is a SV file, the user must select a separator for the columns and selecting
         * a new value will automatically upload the file again. Tests whether the selected file is
         * compatiable with the current {@link mapperState.service:mapperStateService#mapping mapping}
         * and outputs a list of any invalid data property mappings. The directive is replaced by the contents
         * of its template.
         */
        .directive('fileUploadForm', fileUploadForm);

        fileUploadForm.$inject = ['$q', 'delimitedManagerService', 'mapperStateService'];

        function fileUploadForm($q, delimitedManagerService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.dm = delimitedManagerService;
                    dvm.errorMessage = '';
                    dvm.fileObj = undefined;
                    dvm.fileName = 'No file selected'

                    dvm.isExcel = function() {
                        var fileName = _.get(dvm.fileObj, 'name', '');
                        return _.includes(fileName, 'xls');
                    }
                    dvm.upload = function() {
                        if (dvm.fileObj) {
                            dvm.dm.upload(dvm.fileObj).then(data => {
                                dvm.fileName = dvm.fileObj.name;
                                dvm.dm.fileName = data;
                                dvm.errorMessage = '';
                                return dvm.dm.previewFile(50);
                            }, $q.reject).then(() => dvm.state.setInvalidProps(), onError);
                        }
                    }
                    $scope.$watch('dvm.dm.separator', (newValue, oldValue) => {
                        if (newValue !== oldValue && !dvm.isExcel()) {
                            dvm.dm.previewFile(50).then(() => dvm.state.setInvalidProps(), onError);
                        }
                    });
                    function onError(errorMessage) {
                        dvm.errorMessage = errorMessage;
                        dvm.dm.dataRows = undefined;
                        dvm.state.invalidProps = [];
                    }
                }],
                templateUrl: 'mapper/directives/fileUploadForm/fileUploadForm.directive.html'
            }
        }
})();
