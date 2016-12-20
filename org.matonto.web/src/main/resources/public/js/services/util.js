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

        utilService.$inject = ['$filter'];

        function utilService($filter) {
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
        }
})();
