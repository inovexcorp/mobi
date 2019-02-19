/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
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
