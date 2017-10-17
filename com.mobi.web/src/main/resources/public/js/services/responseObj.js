/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

    responseObj.$inject = ['$filter'];

    function responseObj($filter) {
        var self = this;

        /**
         * @ngdoc method
         * @name getItemIri
         * @methodOf responseObj.service:responseObj
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
            if (self.validateItem(item)) {
                iri = item.namespace + item.localName;
            }
            return iri;
        }

        /**
         * @ngdoc method
         * @name validateItem
         * @methodOf responseObj.service:responseObj
         *
         * @description 
         * Checks whether the item passed in is a valid object with a namespace and local name.
         * 
         * @param  {*} item The item to validate
         * @return {boolean} True if the item is an object with a namesapce and local name; false
         * otherwise
         */
        self.validateItem = function(item) {
            return _.has(item, 'namespace') && _.has(item, 'localName');
        }

        /**
         * @ngdoc method
         * @name createItemFromIri
         * @methodOf responseObj.service:responseObj
         *
         * @description
         * Constructs an object response "item" using the provided IRI. This "item" is an Object which contains
         * localName and namespace properties.
         *
         * @param {Object} iri The IRI to use in creating the item
         * @return {Object} The item which represents the provided IRI
         */
        self.createItemFromIri = function(iri) {
            var split = $filter('splitIRI')(iri);
            return {
                namespace: split.begin + split.then,
                localName: split.end
            }
        }
    }
})();