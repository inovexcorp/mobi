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

    angular
        .module('shared')
        .filter('prefixation', prefixation);
})();
