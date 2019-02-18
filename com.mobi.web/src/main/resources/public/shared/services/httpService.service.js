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
            var promise = $http.get(url, addCanceller(config, id));
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
            var promise = $http.post(url, data, addCanceller(config, id));
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
