(function() {
    'use strict';

    editIriOverlay.$inject = ['REGEX'];

    function editIriOverlay(REGEX) {
        return {
            restrict: 'E',
            templateUrl: 'shared/directives/editIriOverlay/editIriOverlay.directive.html',
            scope: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: ['$scope', function($scope) {
                var dvm = this;
                dvm.namespacePattern = REGEX.IRI;
                dvm.localNamePattern = REGEX.LOCALNAME;

                dvm.iriBegin = $scope.resolve.iriBegin;
                dvm.iriThen = $scope.resolve.iriThen;
                dvm.iriEnd = $scope.resolve.iriEnd;

                dvm.submit = function() {
                    $scope.close({$value: {iriBegin: dvm.iriBegin, iriThen: dvm.iriThen, iriEnd: dvm.iriEnd}})
                }
                dvm.resetVariables = function() {
                    dvm.iriBegin = $scope.resolve.iriBegin;
                    dvm.iriThen = $scope.resolve.iriThen;
                    dvm.iriEnd = $scope.resolve.iriEnd;
                }
                dvm.cancel = function() {
                    $scope.dismiss();
                }
            }]
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name editIriOverlay
         *
         * @description
         * The `editIriOverlay` module only provides the `editIriOverlay` directive which creates content
         * for modal to edit an IRI.
         */
        .module('editIriOverlay', [])
        /**
         * @ngdoc directive
         * @name editIriOverlay.directive:editIriOverlay
         * @scope
         * @restrict E
         * @requires REGEX
         *
         * @description
         * `editIriOverlay` is a directive that creates content for a modal that edits an IRI. The form in the modal
         * contains fields for the namespace of the IRI, the local name, and the separator between the namespace and
         * the local name. The parts of the IRI are provided separately. A custom validation function and error message
         * can be provided as well. In addition to the Cancel and Submit buttons, there's also a button to revert the
         * fields to their original state. Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         *
         * @param {Object} resolve Information provided to the modal
         * @param {string} resolve.iriBegin A string containing the beginning/namespace of the IRI
         * @param {string} resolve.iriThen A string containing the separator of the IRI
         * @param {string} resolve.iriEnd A string containing the end/local name of the IRI
         * @param {Object} resolve.customValidation An object containing information for a custom validation of the IRI
         * @param {Function} resolve.customValidation.func A function to be called to validate the IRI. Expects the
         * function to a boolean where true means the IRI is invalid.
         * @param {Function} resolve.customValidation.msg The error message for when the custom validation fails
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('editIriOverlay', editIriOverlay);
})();
