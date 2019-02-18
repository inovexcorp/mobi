(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name datasetFormGroup
         *
         * @description
         * The `datasetFormGroup` module only provides the `datasetFormGroup` directive which creates
         * the dataset select wrapped with a .form-group element and provides a clear action.
         */
        .module('datasetFormGroup', [])
        /**
         * @ngdoc directive
         * @name datasetSelect.directive:datasetSelect
         * @scope
         * @restrict E
         *
         * @description
         * HTML contents in the dataset select which provides a dropdown select of all datasets with a
         * clear button.
         */
        .directive('datasetFormGroup', datasetFormGroup);

        function datasetFormGroup() {
            return {
                restrict: 'E',
                templateUrl: 'discover/directives/datasetFormGroup/datasetFormGroup.directive.html',
                replace: true,
                scope: {
                    onSelect: '&?'
                },
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.clear = function() {
                        dvm.bindModel = '';
                    }
                }
            }
        }
})();