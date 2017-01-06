/*-
 * #%L
 * org.matonto.web
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
         * @name util
         *
         * @description
         * The `util` module only provides the `utilService` service which provides various common utility
         * methods for use across MatOnto.
         */
        .module('util', [])
        /**
         * @ngdoc service
         * @name util.service:utilService
         * @requires $filter
         *
         * @description
         * `utilService` is a service that provides various utility methods for use across MatOnto.
         */
        .service('utilService', utilService);

        utilService.$inject = ['$filter', 'prefixes'];

        function utilService($filter, prefixes) {
            var self = this;

            /**
             * @ngdoc method
             * @name getBeautifulIRI
             * @methodOf util.service:utilService
             *
             * @description
             * Gets the "beautified" IRI representation for the iri passed. Returns the modified IRI.
             *
             * @param {string} iri The IRI string that you want to beautify.
             * @returns {string} The beautified IRI string.
             */
            self.getBeautifulIRI = function(iri) {
                var splitEnd = $filter('splitIRI')(iri).end;
                return splitEnd ? $filter('beautify')(splitEnd) : iri;
            }

            /**
             * @ngdoc method
             * @name getPropertyValue
             * @methodOf util.service:utilService
             *
             * @description
             * Gets the first value of the specified property from the passed entity. Returns an empty
             * string if not found.
             *
             * @param {Object} entity The entity to retrieve the property value from
             * @param {string} propertyIRI The IRI of the property to retrieve
             * @return {string} The first value of the property if found; empty string otherwise
             */
            self.getPropertyValue = function(entity, propertyIRI) {
                return _.get(entity, "['" + propertyIRI + "'][0]['@value']", '');
            }

            self.setPropertyValue = function(entity, propertyIRI, value) {
                _.set(entity, "['" + propertyIRI + "'][0]['@value']", value);
            }

            /**
             * @ngdoc method
             * @name getPropertyValue
             * @methodOf util.service:utilService
             *
             * @description
             * Gets the first value of the specified dcterms property from the passed entity. Returns an empty
             * string if not found.
             *
             * @param {Object} entity The entity to retrieve the property value from
             * @param {string} property The local name of a dcterms property IRI
             * @return {string} The first value of the dcterms property if found; empty string otherwise
             */
            self.getDctermsValue = function(entity, property) {
                return self.getPropertyValue(entity, prefixes.dcterms + property);
            }

            self.setDctermsValue = function(entity, property, value) {
                self.setPropertyValue(entity, prefixes.dcterms + property, value);
            }

            self.getItemNamespace = function(item) {
                return _.get(item, 'namespace', 'No namespace');
            }

            self.mergingArrays = function(objValue, srcValue) {
                if (_.isArray(objValue)) {
                    return _.unionWith(objectValue, srcValue, _.isEqual);
                }
            }
        }
})();
