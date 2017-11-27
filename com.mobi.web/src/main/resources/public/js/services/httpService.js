/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name httpService
         *
         * @description
         * The `httpService` module only provides the `httpService` service which
         * wraps Angular's native $http service.
         */
        .module('httpService', [])
        /**
         * @ngdoc service
         * @name httpService.service:httpService
         * @requires $q
         * @requires $http
         *
         * @description
         * `httpService` is a service that wraps Angular's native $http service and
         * provides a way to determine if a call is still in progress. You can also
         * cancel any pending request.
         */
        .service('httpService', httpService);

    httpService.$inject = ['$q', '$http'];

    function httpService($q, $http) {
        var self = this;

        /**
         * @ngdoc property
         * @name pending
         * @propertyOf httpService.service:httpService
         * @type {Object[]}
         *
         * @description
         * `pending` holds an array of request objects which contain properties associated with the request.
         * The structure of the request object is:
         * ```
         * {
         *     id: '',
         *     canceller: {}
         * }
         * ```
         */
        self.pending = [];

        /**
         * @ngdoc method
         * @name isPending
         * @methodOf httpService.service:httpService
         *
         * @description
         * Checks to see if a request object associated with the provided id exists in the pending array.
         *
         * @param {string} id The id of the request you want to check on.
         * @return {boolean} True if the id is associated with a request item in the pending array,
         *                   false if it is not.
         */
        self.isPending = function(id) {
            return _.some(self.pending, {id});
        }

        /**
         * @ngdoc method
         * @name cancel
         * @methodOf httpService.service:httpService
         *
         * @description
         * Cancels the request object associated with the provided id if it exists in the pending array.
         *
         * @param {string} id The id of the request you want to cancel.
         */
        self.cancel = function(id) {
            if (self.isPending(id)) {
                _.find(self.pending, {id}).canceller.resolve();
            }
        }

        /**
         * @ngdoc method
         * @name get
         * @methodOf httpService.service:httpService
         *
         * @description
         * Wraps Angular's $http.get method to provide a way to track and cancel the associated request.
         * The provided id will be used to create a new request item which is how this request will be
         * tracked. After the request is completed, the associated request item is removed from the
         * pending array.
         *
         * @param {string} url The URL that you want to perform a $http.get on.
         * @param {Object} config The configuration object associated with the $http.get.
         * @param {string} id The id to be assigned to the request that you are making.
         * @return {HttpPromise} The HttpPromise returned by the acutal $http.get method.
         */
        self.get = function(url, config, id) {
            var promise = $http.get(url, addCanceller(config));
            promise.finally(() => _.remove(self.pending, {id}));
            return promise;
        }

        /**
         * @ngdoc method
         * @name post
         * @methodOf httpService.service:httpService
         *
         * @description
         * Wraps Angular's $http.post method to provide a way to track and cancel the associated request.
         * The provided id will be used to create a new request item which is how this request will be
         * tracked. After the request is completed, the associated request item is removed from the
         * pending array.
         *
         * @param {string} url The URL that you want to perform a $http.post on.
         * @param {Object} data The request content.
         * @param {Object} config The configuration object associated with the $http.get.
         * @param {string} id The id to be assigned to the request that you are making.
         * @return {HttpPromise} The HttpPromise returned by the acutal $http.post method.
         */
        self.post = function(url, data, config, id) {
            var promise = $http.post(url, data, addCanceller(config));
            promise.finally(() => _.remove(self.pending, {id}));
            return promise;
        }

        function addCanceller(config, id) {
            var canceller = $q.defer();
            self.pending.push({id, canceller});
            return _.merge({}, config, {timeout: canceller.promise});
        }
    }
})();
