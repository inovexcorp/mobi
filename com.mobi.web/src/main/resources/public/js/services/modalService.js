/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
         * @name modalService
         *
         * @description
         * The `modalService` module only provides the `modalService` service which
         */
        .module('modal', [])
        /**
         * @ngdoc service
         * @name modalService.service:modalService
         * @requires $uibModal
         *
         * @description
         * `modalService` is a service that
         */
        .service('modalService', modalService);

    modalService.$inject = ['$uibModal'];

    function modalService($uibModal) {
        var self = this;

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
