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

        /**
         * @ngdoc method
         * @name getInputType
         * @methodOf exploreUtils.service:exploreUtilsService
         *
         * @description
         * Gets the input type associated with the property in the properties list provided.
         *
         * @param {string} propertyIRI The IRI of the property
         * @param {Object[]} properties The list of property details
         * @returns {string} A string identifying the input type that should be used for the provided property.
         */
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
        /**
         * @ngdoc method
         * @name getPattern
         * @methodOf exploreUtils.service:exploreUtilsService
         *
         * @description
         * Gets the pattern type associated with the property in the properties list provided.
         *
         * @param {string} propertyIRI The IRI of the property
         * @param {Object[]} properties The list of property details
         * @returns {RegEx} A Regular Expression identifying the acceptable values for the provided property.
         */
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
        /**
         * @ngdoc method
         * @name isPropertyOfType
         * @methodOf exploreUtils.service:exploreUtilsService
         *
         * @description
         * Checks to see if the property provided is of the desired type according to the list of properties.
         *
         * @param {string} propertyIRI The IRI of the property
         * @param {string} type The desired type
         * @param {Object[]} properties The list of property details
         * @returns {boolean} True if the property is of the desired type; otherwise, false.
         */
        self.isPropertyOfType = function(propertyIRI, type, properties) {
            return _.some(properties, {propertyIRI, type});
        }
        /**
         * @ngdoc method
         * @name isBoolean
         * @methodOf exploreUtils.service:exploreUtilsService
         *
         * @description
         * Checks to see if the property provided has a boolean range.
         *
         * @param {string} propertyIRI The IRI of the property
         * @param {Object[]} properties The list of property details
         * @returns {boolean} True if the property has a boolean range; otherwise, false.
         */
        self.isBoolean = function(propertyIRI, properties) {
            return self.getRange(propertyIRI, properties) === prefixes.xsd + 'boolean';
        }
        /**
         * @ngdoc method
         * @name createIdObj
         * @methodOf exploreUtils.service:exploreUtilsService
         *
         * @description
         * Creates a JSON-LD object only containing the '@id' property.
         *
         * @param {string} string The string to set as the '@id'
         * @returns {Object} A JSON-LD object containing '@id' set with the provided string.
         */
        self.createIdObj = function(string) {
            return {'@id': string};
        }
        /**
         * @ngdoc method
         * @name createValueObj
         * @methodOf exploreUtils.service:exploreUtilsService
         *
         * @description
         * Creates a JSON-LD object containing the '@value' property and '@type' if required.
         *
         * @param {string} string The string to set as the '@id'
         * @param {string} propertyIRI The IRI of the property
         * @param {Object[]} properties The list of property details
         * @returns {Object} A JSON-LD object containing the '@value' and optionally '@type'.
         */
        self.createValueObj = function(string, propertyIRI, properties) {
            var obj = {'@value': string};
            var range = self.getRange(propertyIRI, properties);
            return range ? _.set(obj, '@type', range) : obj;
        }
        /**
         * @ngdoc method
         * @name getRange
         * @methodOf exploreUtils.service:exploreUtilsService
         *
         * @description
         * Gets the first range of the property from the list of properties.
         *
         * @param {string} propertyIRI The IRI of the property
         * @param {Object[]} properties The list of property details
         * @returns {string} The first range for the property in the list of properties.
         */
        self.getRange = function(propertyIRI, properties) {
            var range = _.get(_.find(properties, {propertyIRI}), 'range', []);
            return range.length ? range[0] : '';
        }
        /**
         * @ngdoc method
         * @name contains
         * @methodOf exploreUtils.service:exploreUtilsService
         *
         * @description
         * Checks to see if the string contains part, ignoring case.
         *
         * @param {string} string The full string to search through
         * @param {string} part The partial string to look for
         * @returns {boolean} True if the string contains the provided part; otherwise, false.
         */
        self.contains = function(string, part) {
            return _.includes(_.toLower(string), _.toLower(part));
        }
        /**
         * @ngdoc method
         * @name getNewProperties
         * @methodOf exploreUtils.service:exploreUtilsService
         *
         * @description
         * Gets the list of properties not set on the provided entity filtered down by the provided text.
         *
         * @param {Object[]} properties The list of property details
         * @param {Object} entity The entity to get properties from
         * @param {string} text The search text
         * @returns {string[]} A list of properties that are not already set on the entity.
         */
        self.getNewProperties = function(properties, entity, text) {
            var properties = _.difference(_.map(properties, 'propertyIRI'), _.keys(entity));
            return text ? _.filter(properties, iri => self.contains(iri, text)) : properties;
        }
        /**
         * @ngdoc method
         * @name removeEmptyProperties
         * @methodOf exploreUtils.service:exploreUtilsService
         *
         * @description
         * Removes properties that have empty values.
         *
         * @param {Object} object The object to remove properties from.
         * @returns {Object} A new object with all of the empty valued properties removed.
         */
        self.removeEmptyProperties = function(object) {
            var copy = angular.copy(object);
            _.forOwn(copy, (value, key) => {
                if (_.isArray(value) && value.length === 0) {
                    delete copy[key];
                }
            });
            return copy;
        }
        /**
         * @ngdoc method
         * @name removeEmptyPropertiesFromArray
         * @methodOf exploreUtils.service:exploreUtilsService
         *
         * @description
         * Removes properties from each item in the array that have empty values.
         *
         * @param {Object[]} array The array that contains the objects to remove properties from.
         * @returns {Object[]} A new array with all of the empty valued properties removed from each object.
         */
        self.removeEmptyPropertiesFromArray = function(array) {
            return _.map(array, item => self.removeEmptyProperties(item));
        }
        /**
         * @ngdoc method
         * @name getReification
         * @methodOf exploreUtils.service:exploreUtilsService
         *
         * @description
         * Retrieves the reified Statement object for the statement matching the provided subject, predicate, and object
         * from the provided JSON-LD array.
         *
         * @param {Object[]} arr A JSON-LD array
         * @param {string} subIRI The subject of the reified statement
         * @param {string} propIRI The predicate of the reified statement
         * @param {Object} valueObj The JSON-LD object representing the object value of the refified statement
         * @return {Object} The refified Statement matching the provided subject, predicate, and object
         */
        self.getReification = function(arr, subIRI, propIRI, valueObj) {
            return _.find(arr, thing => {
                return _.includes(_.get(thing, '@type', []), prefixes.rdf + 'Statement')
                    && _.isEqual(getRdfProperty(thing, 'subject'), [{'@id': subIRI}])
                    && _.isEqual(getRdfProperty(thing, 'predicate'), [{'@id': propIRI}])
                    && _.isEqual(getRdfProperty(thing, 'object'), [valueObj]);
            });
        }

        function getRdfProperty(thing, localName) {
            return _.get(thing, prefixes.rdf + localName, {});
        }
    }
})();