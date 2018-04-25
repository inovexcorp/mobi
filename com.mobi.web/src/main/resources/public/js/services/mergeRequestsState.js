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
         * @name mergeRequestsState
         *
         * @description
         * The `mergeRequestsState` module only provides the `mergeRequestsStateService` service which
         * contains various variables to hold the state of the Merge Requests page and utility functions
         * to update those variables.
         */
        .module('mergeRequestsState', [])
        /**
         * @ngdoc service
         * @name mergeRequestsState.service:mergeRequestsStateService
         *
         * @description
         * `mergeRequestsStateService` is a service which contains various variables to hold the
         * state of the Merge Requests page and utility functions to update those variables.
         */
        .service('mergeRequestsStateService', mergeRequestsStateService);

        function mergeRequestsStateService() {
            var self = this;

            /**
             * @ngdoc property
             * @name open
             * @propertyOf mergeRequestsState.service:mergeRequestsStateService
             * @type {boolean}
             *
             * @description
             * `open` determines whether or not the {@link openTab.directive:openTab open tab} is displayed.
             */
            self.open = true;
        }
})();
