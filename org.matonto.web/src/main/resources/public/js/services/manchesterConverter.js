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
         * @name manchesterConverter
         *
         * @description
         */
        .module('manchesterConverter', [])
        /**
         * @ngdoc service
         * @name manchesterConverter.service:manchesterConverterService
         * @requires $filter
         * @requires prefixes.service:prefixes
         * @requires propertyManager.service:ontologyManagerService
         *
         * @description
         */
        .service('manchesterConverterService', manchesterConverterService);

        manchesterConverterService.$inject = ['$filter', 'ontologyManagerService', 'prefixes'];

        function manchesterConverterService($filter, ontologyManagerService, prefixes) {
            var self = this;
            var om = ontologyManagerService;

            self.jsonldToManchester = function(id, jsonld) {
                var entity = _.find(jsonld, {'@id': id});
                var result = '';
                if (om.isClass(entity)) {
                    var listProp = _.intersection(_.keys(entity), [prefixes.owl + 'unionOf', prefixes.owl + 'intersectionOf']);
                    if (listProp.length === 1) {
                        var joiningWord = listProp[0] === prefixes.owl + 'unionOf' ? ' or ' : ' and ';
                        var list = _.get(entity[listProp[0]], "[0]['@list']", []);
                        result = _.join(_.map(list, item =>  getManchesterValue(item, jsonld)), joiningWord);
                    } else if (_.has(entity, prefixes.owl + 'complementOf')) {
                        var item = _.get(entity, '["' + prefixes.owl + 'complementOf"][0]');
                        result = 'not ' + getManchesterValue(item, jsonld);
                    }
                } else if (om.isRestriction(entity)) {
                    var onProperty = _.get(entity, '["' + prefixes.owl + 'onProperty"][0]["@id"]', '');
                    if (onProperty) {
                        var restriction = $filter('splitIRI')(onProperty).end;
                        if (_.has(entity, prefixes.owl + 'someValuesFrom')) {
                            var item = _.get(entity, '["' + prefixes.owl + 'someValuesFrom"][0]');
                            result += restriction + ' some ' + getManchesterValue(item, jsonld);
                        } else if (_.has(entity, prefixes.owl + 'allValuesFrom')) {
                            var item = _.get(entity, '["' + prefixes.owl + 'allValuesFrom"][0]');
                            result += restriction + ' only ' + getManchesterValue(item, jsonld);
                        } else if (_.has(entity, prefixes.owl + 'hasValue')) {
                            var item = _.get(entity, '["' + prefixes.owl + 'hasValue"][0]');
                            result += restriction + ' value ';
                            if (_.has(item, '@value')) {
                                result += '"' + _.get(item, '@value') + '"';
                            } else {
                                result += getManchesterValue(item, jsonld);
                            }
                        } else if (_.has(entity, prefixes.owl + 'minCardinality')) {
                            var value = _.get(entity, '["' + prefixes.owl + 'minCardinality"][0]["@value"]');
                            result += restriction + ' min ' + value;
                        } else if (_.has(entity, prefixes.owl + 'maxCardinality')) {
                            var value = _.get(entity, '["' + prefixes.owl + 'maxCardinality"][0]["@value"]');
                            result += restriction + ' max ' + value;
                        } else if (_.has(entity, prefixes.owl + 'cardinality')) {
                            var value = _.get(entity, '["' + prefixes.owl + 'cardinality"][0]["@value"]');
                            result += restriction + ' exactly ' + value;
                        }
                    }
                }
                return result;
            }

            function getManchesterValue(item, jsonld) {
                var value = _.get(item, '@id');
                if (om.isBlankNodeId(value)) {
                    var nestedManchester = self.jsonldToManchester(value, jsonld);
                    return '(' + nestedManchester + ')';
                } else {
                    return $filter('splitIRI')(value).end;
                }
            }
        }
})();
