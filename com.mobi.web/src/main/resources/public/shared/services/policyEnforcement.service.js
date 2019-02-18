(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name policyEnforcement
         *
         * @description
         * The `policyEnforcement` module only provides the `policyEnforcementService` service which
         * provides access to the Mobi Policy Enforcement REST endpoint.
         */
        .module('policyEnforcement', [])
        /**
         * @ngdoc service
         * @name policyEnforcement.service:policyEnforcementService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         * @requires httpService.service:httpService
         *
         * @description
         * `policyEnforcementService` is a service that provides access to the Mobi policy enforcement REST
         * endpoint.
         */
        .service('policyEnforcementService', policyEnforcementService);

        policyEnforcementService.$inject = ['$http', '$q', 'REST_PREFIX', 'utilService'];

        function policyEnforcementService($http, $q, REST_PREFIX, utilService) {
            var self = this;
            var prefix = REST_PREFIX + 'pep';
            var util = utilService;

            self.permit = 'Permit';
            self.deny = 'Deny';
            self.indeterminate = 'Indeterminate';

            /**
             * @ngdoc method
             * @name evaluateRequest
             * @methodOf policyEnforcement.service:policyEnforcementService
             *
             * @description
             * Calls the POST /mobirest/pep endpoint with the passed XACML parameters to be evaluated.
             * Example JSON object:
             * {
             *     "resourceId": "http://mobi.com/catalog-local",
             *     "actionId": "http://mobi.com/ontologies/policy#Create",
             *     "actionAttrs": {
             *         "http://www.w3.org/1999/02/22-rdf-syntax-ns#type":"http://mobi.com/ontologies/ontology-editor#OntologyRecord"
             *     }
             * }
             *
             * @param {Object} [jsonRequest] An Object of ids and attributes to create a XACML request
             * @return {Promise} A Promise that resolves to a string of the decision of the request or is rejected with
             * an error message
             */
            self.evaluateRequest = function(jsonRequest) {
                var filteredRequest = _.pick(jsonRequest, ['resourceId', 'actionId', 'actionAttrs', 'resourceAttrs', 'subjectAttrs']);
                return $http.post(prefix, filteredRequest)
                    .then(response => response.data, util.rejectError);
            }
        }
})();