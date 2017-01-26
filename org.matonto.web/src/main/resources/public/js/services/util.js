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

        utilService.$inject = ['$filter', 'prefixes', 'toastr'];

        function utilService($filter, prefixes, toastr) {
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

            /**
             * @ngdoc method
             * @name getDctermsId
             * @methodOf util.service:utilService
             *
             * @description
             * Gets the first id value of the specified dcterms property from the passed entity. Returns an
             * empty string if not found.
             *
             * @param {Object} entity The entity to retrieve the property id value from
             * @param {string} property The local name of a dcterms property IRI
             * @return {string} The first id value of the dcterms property if found; empty string otherwise
             */
            self.getDctermsId = function(entity, property) {
                return _.get(entity, "['" + prefixes.dcterms + property + "'][0]['@id']", '');
            }

            /**
             * @ngdoc method
             * @name parseLinks
             * @methodOf util.service:utilService
             *
             * @description
             * Parses through the passed "link" header string to retrieve each individual link and its rel label.
             * Return an object with keys of the link rel labels and values of the link URLs.
             *
             * @param {string} header A "link" header string from an HTTP response
             * @return {Object} An object with keys of the rel labels and values of URLs
             */
            self.parseLinks = function(header){
                // Split parts by comma
                var parts = header.split(',');
                var links = {};
                // Parse each part into a named link
                _.forEach(parts, p => {
                    var section = p.split(';');
                    if (section.length === 2) {
                        var url = section[0].replace(/<(.*)>/, '$1').trim();
                        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
                        links[name] = url;
                    }
                });
                return links;
            }

            /**
             * @ngdoc method
             * @name createErrorToast
             * @methodOf util.service:utilService
             *
             * @description
             * Creates an error toast with the passed error text that will not disappear until it is dismissed.
             *
             * @param {string} text The text for the body of the error toast
             */
            self.createErrorToast = function(text) {
                toastr.error(text, 'Error', {timeOut: 0});
            }
        }
})();
