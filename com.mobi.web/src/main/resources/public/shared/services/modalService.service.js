(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name modal
         *
         * @description
         * The `modalService` module only provides the `modalService` service which provides helper methods for
         * instantiating and opening modals.
         */
        .module('modal', [])
        /**
         * @ngdoc service
         * @name modal.service:modalService
         * @requires $uibModal
         *
         * @description
         * `modalService` is a service that provides functionality to open modals based on the name of the directive.
         * It uses the $uibModal service to create modals.
         */
        .service('modalService', modalService);

    modalService.$inject = ['$uibModal'];

    function modalService($uibModal) {
        var self = this;

        /**
         * @ngdoc method
         * @name openModal
         * @methodOf modal.service:modalService
         *
         * @description
         * Opens a specific modal directive with the provided configuration. The contents of the specified directive
         * will be put inside a modal element. The directive will have access to three scope parameters: resolve (an
         * object of values), dismiss (a function called when the modal is canceled), and close (a function called when
         * the modal is closed/confirmed).
         *
         * @param {string} componentName The name of the directive to open as a modal
         * @param {Object} resolve Values that should be available as properties on the resolve object in the modal
         * directive
         * @param {Function} onClose A function to be called when the modal is closed (not dismissed)
         * @param {string} size A string representing the size of the modal. Expected values are "sm" and "lg". The
         * default is a medium sized modal
         */
        self.openModal = function(componentName, resolve = {}, onClose, size) {
            var configObj = {
                component: componentName,
                resolve: _.mapValues(resolve, val => {
                    return () => val;
                })
            };
            if (size) {
                configObj.size = size;
            }
            var instance = $uibModal.open(configObj);
            if (onClose) {
                instance.result.then(onClose);
            }
        }
        /**
         * @ngdoc method
         * @name openConfirmModal
         * @methodOf modal.service:modalService
         *
         * @description
         * Opens a {@link confirmModal.directive:confirmModal} with the provided configuration. The body of the
         * `confirmModal` is provided as a string. Custom implementation for the confirm and deny actions are provided
         * as the `yes` and `no` functions respectively.
         *
         * @param {string} body The HTML string for the body of the `confirmModal`
         * @param {Function} yes A function to be called when the overlay is closed/confirmed (not dismissed)
         * @param {Function} not A function to be called when the overlay is dismissed/denied (not closed)
         * @param {string} size A string representing the size of the modal. Expected values are "sm" and "lg". The
         * default is a medium sized modal
         */
        self.openConfirmModal = function(body, yes = _.noop, no = _.noop, size) {
            var configObj = {
                component: 'confirmModal',
                resolve: {
                    body: () => body,
                    no: () => no,
                    yes: () => yes
                }
            };
            if (size) {
                configObj.size = size;
            }
            $uibModal.open(configObj);
        }
    }
})();
