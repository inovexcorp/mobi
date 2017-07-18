/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name exploreUtils
         *
         * @description
         * The `exploreUtils` module only provides the `exploreUtilsService` service which provides utility
         * functions for the explore sub module.
         */
        .module('exploreUtils', [])
        /**
         * @ngdoc service
         * @name exploreUtils.service:exploreUtilsService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `exploreUtilsService` is a service that provides utility functions for the explore sub module.
         */
        .service('exploreUtilsService', exploreUtilsService);
        
    exploreUtilsService.$inject = ['REGEX', 'prefixes'];
    
    function exploreUtilsService(REGEX, prefixes) {
        var self = this;
        
        self.getInputType = function(propertyIRI, properties) {
            switch (_.replace(self.getRange(propertyIRI, properties), prefixes.xsd, '')) {
                case 'dateTime':
                case 'dateTimeStamp':
                    return 'date';
                case 'decimal':
                case 'double':
                case 'float':
                case 'int':
                case 'integer':
                case 'long':
                case 'short':
                    return 'number';
                default:
                    return 'text';
            }
        }
        
        self.getPattern = function(propertyIRI, properties) {
            switch (_.replace(self.getRange(propertyIRI, properties), prefixes.xsd, '')) {
                case 'dateTime':
                case 'dateTimeStamp':
                    return REGEX.DATETIME;
                case 'decimal':
                case 'double':
                case 'float':
                    return REGEX.DECIMAL;
                case 'int':
                case 'long':
                case 'short':
                case 'integer':
                    return REGEX.INTEGER;
                default:
                    return REGEX.ANYTHING;
            }
        }
        
        self.isPropertyOfType = function(propertyIRI, type, properties) {
            return _.some(properties, {propertyIRI, type});
        }
        
        self.isBoolean = function(propertyIRI, properties) {
            return self.getRange(propertyIRI, properties) === prefixes.xsd + 'boolean';
        }
        
        self.createIdObj = function(string) {
            return {'@id': string};
        }
        
        self.createValueObj = function(string, propertyIRI, properties) {
            var obj = {'@value': string};
            var range = self.getRange(propertyIRI, properties);
            return range ? _.set(obj, '@type', range) : obj;
        }

        self.getRange = function(propertyIRI, properties) {
            var range = _.get(_.find(properties, {propertyIRI}), 'range', []);
            return range.length ? range[0] : '';
        }
        
        self.contains = function(string, part) {
            return _.includes(_.toLower(string), _.toLower(part));
        }
        
        self.getNewProperties = function(properties, entity, text) {
            var properties = _.difference(_.map(properties, 'propertyIRI'), _.keys(entity));
            return text ? _.filter(properties, iri => self.contains(iri, text)) : properties;
        }
        
        self.removeEmptyProperties = function(object) {
            var copy = angular.copy(object);
            _.forOwn(copy, (value, key) => {
                if (_.isArray(value) && value.length === 0) {
                    delete copy[key];
                }
            });
            return copy;
        }
    }
})();