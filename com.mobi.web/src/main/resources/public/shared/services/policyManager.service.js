(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name policyManager
         *
         * @description
         * The `policyManager` module only provides the `policyManagerService` service which
         * provides access to the Mobi policy REST endpoints and variables with common IRIs
         * used in policies.
         */
        .module('policyManager', [])
        /**
         * @ngdoc service
         * @name policyManager.service:policyManagerService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         * @requires httpService.service:httpService
         *
         * @description
         * `policyManagerService` is a service that provides access to the Mobi policy REST
         * endpoints and variables with common IRIs used in policies.
         */
        .service('policyManagerService', policyManagerService);

        policyManagerService.$inject = ['$http', '$q', 'REST_PREFIX', 'utilService', 'prefixes'];

        function policyManagerService($http, $q, REST_PREFIX, utilService, prefixes) {
            var self = this;
            var prefix = REST_PREFIX + 'policies';
            var util = utilService;

            // Common IRIs used in policies

            self.actionCreate = prefixes.policy + 'Create';
            self.actionRead = prefixes.policy + 'Read';
            self.actionUpdate = prefixes.policy + 'Update';
            self.actionDelete = prefixes.policy + 'Delete';
            self.actionModify = prefixes.catalog + 'Modify';
            self.subjectId = 'urn:oasis:names:tc:xacml:1.0:subject:subject-id';
            self.resourceId = 'urn:oasis:names:tc:xacml:1.0:resource:resource-id';
            self.actionId = 'urn:oasis:names:tc:xacml:1.0:action:action-id';
            self.subjectCategory = 'urn:oasis:names:tc:xacml:1.0:subject-category:access-subject';
            self.resourceCategory = 'urn:oasis:names:tc:xacml:3.0:attribute-category:resource';
            self.actionCategory = 'urn:oasis:names:tc:xacml:3.0:attribute-category:action';
            self.stringEqual = 'urn:oasis:names:tc:xacml:1.0:function:string-equal';

            /**
             * @ngdoc method
             * @name getPolicies
             * @methodOf policyManager.service:policyManagerService
             *
             * @description
             * Calls the GET /mobirest/policies endpoint with the passed filter values for
             * http://mobi.com/ontologies/policy#relatedResource, http://mobi.com/ontologies/policy#relatedSubject, and
             * http://mobi.com/ontologies/policy#relatedAction and returns the list of matching Policies in JSON.
             *
             * @param {string} [relatedResource=''] An optional IRI string for a related Resource
             * @param {string} [relatedSubject=''] An optional IRI string for a related Subject
             * @param {string} [relatedAction=''] An optional IRI string for a related Action
             * @return {Promise} A Promise that resolves to a JSON array of Policy JSON objects or is rejected with
             * an error message
             */
            self.getPolicies = function(relatedResource = undefined, relatedSubject = undefined, relatedAction = undefined) {
                var config = {
                    params: {
                        relatedResource,
                        relatedSubject,
                        relatedAction
                    }
                };
                return $http.get(prefix, config)
                    .then(response => response.data, util.rejectError);
            }

            /**
             * @ngdoc method
             * @name getPolicy
             * @methodOf policyManager.service:policyManagerService
             *
             * @description
             * Calls the GET /mobirest/policies/{policyId} endpoint to get the Policy for the provided ID.
             *
             * @param {string} policyId The ID of a Policy to retrieve
             * @return {Promise} A Promise that resolves with the matching Policy if found or is rejected with an
             * error message
             */
            self.getPolicy = function(policyId) {
                return $http.get(prefix + '/' + encodeURIComponent(policyId))
                    .then(response => response.data, util.rejectError);
            }

            /**
             * @ngdoc method
             * @name updatePolicy
             * @methodOf policyManager.service:policyManagerService
             *
             * @description
             * Calls the PUT /mobirest/policies/{policyId} endpoint with the provided new Policy object and updates
             * the Policy with the matching ID.
             *
             * @param {Object} newPolicy A Policy JSON object to replace the original with
             * @return {Promise} A Promise that resolves if the update was successful or is rejected with an error
             * message
             */
            self.updatePolicy = function(newPolicy) {
                return $http.put(prefix + '/' + encodeURIComponent(newPolicy.PolicyId), newPolicy)
                    .then(_.noop, util.rejectError);
            }
        }
})();
