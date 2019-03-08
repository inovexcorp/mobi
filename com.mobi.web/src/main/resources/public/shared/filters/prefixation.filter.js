/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    prefixation.$inject = ['prefixes'];

    /**
     * @ngdoc filter
     * @name shared.filter:prefixation
     * @kind function
     * @requires shared.service:prefixes
     *
     * @description
     * Takes an IRI string and converts it to a prefixed IRI string using the {@link shared.service:prefixes} service
     * and any provided `extraPrefixes`.
     *
     * @param {string} iri An IRI string
     * @param {Object} extraPrefixes An optional object of extra prefixes to search for namespaces through. The prefixes
     * should be the keys and the namespaces should be the values.
     * @returns {string} The prefixed version of the IRI is a prefix was found for the namespace. Otherwise, the same
     * IRI is returned.
     */
    function prefixation(prefixes) {
        return function(iri, extraPrefixes={}) {
            var result = angular.copy(iri);
            if (typeof result === 'string') {
                _.forOwn(_.merge({}, prefixes, extraPrefixes), (namespace, prefix) => {
                    if (_.includes(result, namespace)) {
                        result = _.replace(result, namespace, prefix + ':');
                        return;
                    }
                });
            }
            return result;
        }
    }

    angular.module('shared')
        .filter('prefixation', prefixation);
})();
