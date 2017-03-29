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
            var expressionClassName = 'manchester-expr';
            var restrictionClassName = 'manchester-rest';
            var literalClassName = 'manchester-lit';
            var expressionKeywords = {
                [prefixes.owl + 'unionOf']: ' or ',
                [prefixes.owl + 'intersectionOf']: ' and ',
                [prefixes.owl + 'complementOf']: 'not '
            };
            var restrictionKeywords = {
                [prefixes.owl + 'someValuesFrom']: ' some ',
                [prefixes.owl + 'allValuesFrom']: ' only ',
                [prefixes.owl + 'hasValue']: ' value ',
                [prefixes.owl + 'minCardinality']: ' min ',
                [prefixes.owl + 'maxCardinality']: ' max ',
                [prefixes.owl + 'cardinality']: ' exactly '
            };

            self.jsonldToManchester = function(id, jsonld, html = false) {
                var entity = _.find(jsonld, {'@id': id});
                var result = '';
                if (om.isClass(entity)) {
                    var prop = _.intersection(_.keys(entity), _.keys(expressionKeywords));
                    if (prop.length === 1) {
                        var item = _.get(entity[prop[0]], '0');
                        var keyword = html ? surround(expressionKeywords[prop[0]], expressionClassName) : expressionKeywords[prop[0]];
                        if (_.has(item, '@list')) {
                            result += _.join(_.map(_.get(item, '@list'), item =>  getManchesterValue(item, jsonld, html)), keyword);
                        } else {
                            result += keyword + getManchesterValue(item, jsonld, html);
                        }
                    }
                } else if (om.isRestriction(entity)) {
                    var onProperty = _.get(entity, '["' + prefixes.owl + 'onProperty"][0]["@id"]', '');
                    if (onProperty) {
                        var restriction = $filter('splitIRI')(onProperty).end;
                        var prop = _.intersection(_.keys(entity), _.keys(restrictionKeywords));
                        if (prop.length === 1) {
                            var item = _.get(entity[prop[0]], '0');
                            var keyword = html ? surround(restrictionKeywords[prop[0]], restrictionClassName) : restrictionKeywords[prop[0]];
                            result += restriction + keyword + getManchesterValue(item, jsonld, html);
                        }
                    }
                }
                return result;
            }

            function getManchesterValue(item, jsonld, html = false) {
                if (_.has(item, '@value')) {
                    var literal = _.get(item, '@type') === prefixes.xsd + 'string' ? '"' + item['@value'] + '"' : item['@value'];
                    return html ? surround(literal, literalClassName) : literal;
                } else {
                    var value = _.get(item, '@id');
                    return om.isBlankNodeId(value) ? '(' + self.jsonldToManchester(value, jsonld, html) + ')' : $filter('splitIRI')(value).end;
                }
            }

            function surround(str, className) {
                return '<span class="' + className + '">' + str + '</span>';
            }
        }
})();
