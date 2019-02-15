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
         * @name mapperSerializationSelect
         *
         * @description
         * The `mapperSerializationSelect` module only provides the `mapperSerializationSelect` directive
         * which creates a select with different serialization formats specifically for the mapping tool.
         */
        .module('mapperSerializationSelect', [])
        /**
         * @ngdoc directive
         * @name mapperSerializationSelect.directive:mapperSerializationSelect
         * @scope
         * @restrict E
         *
         * @description
         * `mapperSerializationSelect` is a directive which creates a select with the following options
         * for a RDF serialization format: JSON-LD, Turtle, and RDF/XML. The directive is replaced by the
         * contents of its template.
         *
         * @param {string} format A string representing an RDF serialization
         */
        .directive('mapperSerializationSelect', mapperSerializationSelect);

        function mapperSerializationSelect() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                require: '^form',
                replace: true,
                scope: {
                    format: '=',
                },
                controller: function() {
                    var dvm = this;
                    dvm.options = [
                        {
                            name: 'JSON-LD',
                            value: 'jsonld'
                        },
                        {
                            name: 'Turtle',
                            value: 'turtle'
                        },
                        {
                            name: 'RDF/XML',
                            value: 'rdf/xml'
                        }
                    ];
                },
                templateUrl: 'modules/mapper/directives/mapperSerializationSelect/mapperSerializationSelect.directive.html'
            }
        }
})();
