(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name responseObj
         *
         * @description 
         * The `responseObj` module only provides the `responseObj` service which provides 
         * utility functions for processing objects created by the 
         * {@link ontologyManager.service:ontologyManager ontologyManager}.
         */
        .module('responseObj', [])
        /**
         * @ngdoc service
         * @name responseObj.service:responseObj
         *
         * @description 
         * `responseObj` is a service which provides utility functions for processings
         * objects created by the {@link ontologyManager.service:ontologyManager ontologyManager}.
         */
        .service('responseObj', responseObj);

    function responseObj() {
        var self = this;

        /**
         * @ngdoc method
         * @name getItemIri
         * @methodOf responseObj.responseObj
         * 
         * @description
         * Retrieves an item's IRI by combining the namespace and local name. If the 
         * item does not contain those fields, returns an empty string
         * 
         * @param {Object} item The item to get the IRI for
         * @return {string} The IRI of the item or an empty string if the item is not valid
         */
        self.getItemIri = function(item) {
            var iri = '';

            if(self.validateItem(item)) {
                iri = item.namespace + item.localName;
            }

            return iri;
        }

        /**
         * @ngdoc method
         * @name validateItem
         * @methodOf responseObj.responseObj
         *
         * @description 
         * Checks whether the item passed in is a valid object with a namespace and local name.
         * 
         * @param  {*} item The item to validate
         * @return {boolean} True if the item is an object with a namesapce and local name; false
         * otherwise
         */
        self.validateItem = function(item) {
            return (item && item.hasOwnProperty('namespace') && item.hasOwnProperty('localName')) ? true : false;
        }
    }
})();