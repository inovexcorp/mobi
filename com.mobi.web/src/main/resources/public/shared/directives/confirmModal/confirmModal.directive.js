(function() {
    'use strict';

    function confirmModal() {
        return {
            restrict: 'E',
            scope: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: ['$scope', function($scope) {
                var dvm = this;

                dvm.yes = function() {
                    Promise.resolve($scope.resolve.yes()).then(() => {
                        $scope.close();
                    });
                }
                dvm.no = function() {
                    Promise.resolve($scope.resolve.no()).then(() => $scope.dismiss());
                }
            }],
            templateUrl: 'shared/directives/confirmModal/confirmModal.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name confirmModal
         *
         * @description
         * The `confirmModal` module only provides the `confirmModal` directive which creates content
         * for a modal to confirm or deny an action.
         */
        .module('confirmModal', [])
        /**
         * @ngdoc directive
         * @name confirmModal.directive:confirmModal
         * @scope
         * @restrict E
         *
         * @description
         * `confirmModal` is a directive that creates content for a modal that will confirm or deny an action
         * being taken. Meant to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Object} resolve Information provided to the modal
         * @param {string} resolve.body An HTML string to be interpolated into the body of the modal
         * @param {Function} resolve.yes A function to be called when the modal is closed (not dismissed)
         * @param {Function} resolve.no A function to be called when the modal is dismissed (not closed)
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('confirmModal', confirmModal);
})();
