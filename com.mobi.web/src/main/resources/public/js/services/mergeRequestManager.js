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
         * @name mergeRequestManager
         *
         * @description
         * The `mergeRequestManager` module only provides the `mergeRequestManagerService` service which
         * provides access to the Mobi merge-requests REST endpoints and utility methods.
         */
        .module('mergeRequestManager', [])
        .config(['$qProvider', function($qProvider) {
            $qProvider.errorOnUnhandledRejections(false);
        }])
        /**
         * @ngdoc service
         * @name mergeRequestManager.service:mergeRequestManagerService
         *
         * @description
         * `mergeRequestManagerService` is a service that provides access to the Mobi merge-requests REST
         * endpoints along with utility methods for working with Merge Requests and their components.
         */
        .service('mergeRequestManagerService', mergeRequestManagerService);

        mergeRequestManagerService.$inject = ['$http', '$q', 'utilService', 'prefixes', 'REST_PREFIX'];

        function mergeRequestManagerService($http, $q, utilService, prefixes, REST_PREFIX) {
            var self = this,
                prefix = REST_PREFIX + 'merge-requests';
            var util = utilService;

            /**
             * @ngdoc method
             * @name getRequests
             * @methodOf mergeRequestManager.service:mergeRequestManagerService
             *
             * @description
             * Calls the GET /mobirest/merge-requests endpoint with the provided object of query parameters
             * which retrieves a list of MergeRequests.
             *
             * @param {Object} params An object with all the query parameter settings for the REST call
             * @param {boolean} params.accepted Whether the list should be accepted MergeRequests or open ones
             * @param {string} params.sort A property to sort the results by
             * @param {boolean} params.ascending Whether the list should be sorted ascending or descending
             * @returns {Promise} A promise that resolves with the list of MergeRequests or rejects with an
             * error message.
             */
            self.getRequests = function(params) {
                var config = {params};
                return $http.get(prefix, config)
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name createRequest
             * @methodOf mergeRequestManager.service:mergeRequestManagerService
             *
             * @description
             * Calls the POST /mobirest/merge-requests endpoint with the passed metadata and creates a new
             * MergeRequest. Returns a Promise with the IRI of the new MergeRequest if successful or
             * rejects with an error message.
             *
             * @param {Object} requestConfig A configuration object containing metadata for the new MergeRequest
             * @param {string} requestConfig.title The required title of the new MergeRequest
             * @param {string} requestConfig.description The optional description of the new MergeRequest
             * @param {string} requestConfig.recordId The required IRI of the VersionedRDFRecord of the new MergeRequest
             * @param {string} requestConfig.sourceBranchId The required IRI of the source Branch for the new MergeRequest
             * @param {string} requestConfig.targetBranchId The required IRI of the target Branch for the new MergeRequest
             * @param {string[]} requestConfig.assignees The optional usernames of the assignees of the new MergeRequest
             * @param {string} requestConfig.removeSource A boolean indicating whether the sourceBranch should be removed on acceptance
             * @return {Promise} A promise that resolves to the IRI of the new MergeRequest or is rejected with
             * an error message
             */
            self.createRequest = function(requestConfig) {
                var fd = new FormData(),
                    config = {
                        transformRequest: _.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                fd.append('title', requestConfig.title);
                fd.append('recordId', requestConfig.recordId);
                fd.append('sourceBranchId', requestConfig.sourceBranchId);
                fd.append('targetBranchId', requestConfig.targetBranchId);
                if (_.has(requestConfig, 'description')) {
                    fd.append('description', requestConfig.description);
                }
                _.forEach(_.get(requestConfig, 'assignees', []), username => fd.append('assignees', username));
                if (_.has(requestConfig, 'removeSource')) {
                    fd.append('removeSource', requestConfig.removeSource);
                }
                return $http.post(prefix, fd, config)
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getRequest
             * @methodOf mergeRequestManager.service:mergeRequestManagerService
             *
             * @description
             * Calls the GET /mobirest/merge-requests/{requestId} endpoint to retrieve a single Merge Request
             * with a matching IRI.
             *
             * @param {string} params An IRI ID of a Merge Request
             * @returns {Promise} A promise that resolves with Merge Request if found or rejects with an
             * error message.
             */
            self.getRequest = function(requestId) {
                return $http.get(prefix + '/' + encodeURIComponent(requestId))
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name deleteRequest
             * @methodOf mergeRequestManager.service:mergeRequestManagerService
             *
             * @description
             * Calls the DELETE /mobirest/merge-requests/{requestId} endpoint to remove a single Merge Request
             * with a matching IRI from the application.
             *
             * @param {string} params An IRI ID of a Merge Request
             * @returns {Promise} A promise that resolves if the request was deleted or rejects with an
             * error message.
             */
            self.deleteRequest = function(requestId) {
                return $http.delete(prefix + '/' + encodeURIComponent(requestId))
                    .then(_.noop, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name acceptRequest
             * @methodOf mergeRequestManager.service:mergeRequestManagerService
             *
             * @description
             * Calls the POST /mobirest/merge-requests/{requestId} endpoint to accept a Merge Request
             * with a matching IRI and perform the represented merge.
             *
             * @param {string} requestId An IRI ID of a Merge Request
             * @returns {Promise} A promise that resolves if the request was accepted or rejects with an
             * error message.
             */
            self.acceptRequest = function(requestId) {
                return $http.post(prefix + '/' + encodeURIComponent(requestId))
                    .then(_.noop, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getComments
             * @methodOf mergeRequestManager.service:mergeRequestManagerService
             *
             * @description
             * Calls the GET /mobirest/merge-requests/{requestId}/comments endpoint to retrieve the array of comment
             * chains for the Merge Request with a matching IRI.
             *
             * @param {string} requestId An IRI ID of a Merge Request
             * @returns {Promise} A promise that resolves with an array of arrays of JSON-LD objects representing
             *      comment chains or rejects with an error message.
             */
            self.getComments = function(requestId) {
                return $http.get(prefix + '/' + encodeURIComponent(requestId) + '/comments')
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name deleteComment
             * @methodOf mergeRequestManager.service:mergeRequestManagerService
             *
             * @description
             * Calls the DELETE /mobirest/merge-requests/{requestId}/comments/{commentId} endpoint to delete a comment
             * with a matching IRI from the Merge Request with a matching IRI.
             *
             * @param {string} requestId An IRI ID of a Merge Request
             * @param {string} commentId An IRI ID of a Comment on the Merge Request
             * @returns {Promise} A promise that resolves if the comment was deleted or rejects with an error message.
             */
            self.deleteComment = function(requestId, commentId) {
                return $http.delete(prefix + '/' + encodeURIComponent(requestId) + '/comments/' + encodeURIComponent(commentId))
                    .then(_.noop, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name createComment
             * @methodOf mergeRequestManager.service:mergeRequestManagerService
             *
             * @description
             * Calls the POST /mobirest/merge-requests/{requestId}/comments endpoint to create a comment on the Merge
             * Request with a matching IRI with the provided comment string. Can optionally specify the comment the new
             * comment is reply to.
             *
             * @param {string} requestId An IRI ID of a Merge Request
             * @param {string} commentStr A string to be the body of the new Comment
             * @param {string} [replyComment = ''] An IRI ID of a Comment on the Merge Request
             * @returns {Promise} A promise that resolves if the comment was created or rejects with an error message.
             */
            self.createComment = function(requestId, commentStr, replyComment = '')  {
                var config = {
                    headers: {
                        'Content-Type': 'text/plain'
                    }
                };
                if (replyComment) {
                    config.params = { commentId: replyComment };
                }
                return $http.post(prefix + '/' + encodeURIComponent(requestId) + '/comments', commentStr, config)
                    .then(_.noop, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name updateRequest
             * @methodOf mergeRequestManager.service:mergeRequestManagerService
             *
             * @description
             * Calls the PUT /mobirest/merge-requests/{requestId} endpoint to update a Merge Request
             * with a matching IRI.
             * 
             * @param {string} requestId An IRI of a MergeRequest
             * @param {Object} jsonld A MergeRequest JSON-LD object
             * @return {Promise} A promise that resolves to the IRI of the updated MergeRequest or is rejected with
             * an error message
             */
            self.updateRequest = function(requestId, jsonld) {
                return $http.put(prefix + '/' + encodeURIComponent(requestId), jsonld)
                    .then(response => response.data, util.rejectError);
            }
            
            /**
             * @ngdoc method
             * @name isAccepted
             * @methodOf mergeRequestManager.service:mergeRequestManagerService
             *
             * @description
             * Determines whether the passed request is accepted or not.
             *
             * @param {Object} request A MergeRequest JSON-LD object
             * @return {boolean} True if the MergeRequest is accepted; false otherwise
             */
            self.isAccepted = function(request) {
                return _.includes(request['@type'], prefixes.mergereq + 'AcceptedMergeRequest');
            }
        }
})();
