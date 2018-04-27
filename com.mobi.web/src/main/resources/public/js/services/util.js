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
         * @name util
         *
         * @description
         * The `util` module only provides the `utilService` service which provides various common utility
         * methods for use across Mobi.
         */
        .module('util', [])
        /**
         * @ngdoc service
         * @name util.service:utilService
         * @requires $filter
         * @requires $http
         * @requires $q
         * @requires uuid
         * @requires toastr
         * @requires prefixes.service:prefixes
         * @requires httpService.service:httpService
         *
         * @description
         * `utilService` is a service that provides various utility methods for use across Mobi.
         */
        .service('utilService', utilService);

        utilService.$inject = ['$filter', '$http', '$q', '$window', '$rootScope', 'uuid', 'toastr', 'prefixes', 'httpService', 'REGEX'];

        function utilService($filter, $http, $q, $window, $rootScope, uuid, toastr, prefixes, httpService, REGEX) {
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
                if (splitEnd) {
                    return splitEnd.match(REGEX.UUID) ? splitEnd : $filter('beautify')(splitEnd);
                }
                return iri;
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
             * @param {string} propertyIRI The IRI of a property
             * @return {string} The first value of the property if found; empty string otherwise
             */
            self.getPropertyValue = function(entity, propertyIRI) {
                return _.get(entity, "['" + propertyIRI + "'][0]['@value']", '');
            }
            /**
             * @ngdoc method
             * @name setPropertyValue
             * @methodOf util.service:utilService
             *
             * @description
             * Sets the first or appends to the existing value of the specified property of the passed entity to the
             * passed value.
             *
             * @param {Object} entity The entity to set the property value of
             * @param {string} propertyIRI The IRI of a property
             * @param {string} value The new value for the property
             */
            self.setPropertyValue = function(entity, propertyIRI, value) {
                setValue(entity, propertyIRI, {'@value': value});
            }
            /**
             * @ngdoc method
             * @name hasPropertyValue
             * @methodOf util.service:utilService
             *
             * @description
             * Tests whether or not the passed entity contains the passed value for the passed property.
             *
             * @param {Object} entity The entity to look for the property value in
             * @param {string} propertyIRI The IRI of a property
             * @param {string} value The value to search for
             * @return {boolean} True if the entity has the property value; false otherwise
             */
            self.hasPropertyValue = function(entity, propertyIRI, value) {
                return hasValue(entity, propertyIRI, {'@value': value});
            }
            /**
             * @ngdoc method
             * @name removePropertyValue
             * @methodOf util.service:utilService
             *
             * @description
             * Remove the passed value of the passed property from the passed entity.
             *
             * @param {Object} entity The entity to remove the property value from
             * @param {string} propertyIRI The IRI of a property
             * @param {string} value The value to remove
             */
            self.removePropertyValue = function(entity, propertyIRI, value) {
                removeValue(entity, propertyIRI, {'@value': value});
            }
            /**
             * @ngdoc method
             * @name getPropertyId
             * @methodOf util.service:utilService
             *
             * @description
             * Gets the first id value of the specified property from the passed entity. Returns an empty
             * string if not found.
             *
             * @param {Object} entity The entity to retrieve the property id value from
             * @param {string} propertyIRI The IRI of a property
             * @return {string} The first id value of the property if found; empty string otherwise
             */
            self.getPropertyId = function(entity, propertyIRI) {
                return _.get(entity, "['" + propertyIRI + "'][0]['@id']", '');
            }
            /**
             * @ngdoc method
             * @name setPropertyId
             * @methodOf util.service:utilService
             *
             * @description
             * Sets the first or appends to the existing id of the specified property of the passed entity to the passed
             * id.
             *
             * @param {Object} entity The entity to set the property value of
             * @param {string} propertyIRI The IRI of a property
             * @param {string} id The new id value for the property
             */
            self.setPropertyId = function(entity, propertyIRI, id) {
                setValue(entity, propertyIRI, {'@id': id});
            }
            /**
             * @ngdoc method
             * @name hasPropertyId
             * @methodOf util.service:utilService
             *
             * @description
             * Tests whether or not the passed entity contains the passed id value for the passed property.
             *
             * @param {Object} entity The entity to look for the property id value in
             * @param {string} propertyIRI The IRI of a property
             * @param {string} id The id value to search for
             * @return {boolean} True if the entity has the property id value; false otherwise
             */
            self.hasPropertyId = function(entity, propertyIRI, id) {
                return hasValue(entity, propertyIRI, {'@id': id});
            }
            /**
             * @ngdoc method
             * @name removePropertyId
             * @methodOf util.service:utilService
             *
             * @description
             * Remove the passed id value of the passed property from the passed entity.
             *
             * @param {Object} entity The entity to remove the property id value from
             * @param {string} propertyIRI The IRI of a property
             * @param {string} id The id value to remove
             */
            self.removePropertyId = function(entity, propertyIRI, id) {
                removeValue(entity, propertyIRI, {'@id': id});
            }

            /**
             * @ngdoc method
             * @name replacePropertyId
             * @methodOf util.service:utilService
             *
             * @description
             * Remove the passed id value of the passed property from the passed entity.
             *
             * @param {Object} entity The entity to remove the property id value from
             * @param {string} propertyIRI The IRI of a property
             * @param {string} idToRemove The id value to remove
             * @param {string} idToAdd The id value to Add
             */
            self.replacePropertyId = function(entity, propertyIRI, idToRemove, idToAdd) {
                removePropertyId(entity, propertyIRI, idToRemove);
                setPropertyId(entity, propertyIRI, idToAdd);
            }

            /**
             * @ngdoc method
             * @name getDctermsValue
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
             * @name setDctermsValue
             * @methodOf util.service:utilService
             *
             * @description
             * Sets the first value of the specified dcterms property of the passed entity to the passed value.
             *
             * @param {Object} entity The entity to set the property value of
             * @param {string} property The local name of a dcterms property IRI
             * @param {string} value The new value for the property
             */
            self.setDctermsValue = function(entity, property, value) {
                self.setPropertyValue(entity, prefixes.dcterms + property, value);
            }
            /**
             * @ngdoc method
             * @name mergingArrays
             * @methodOf util.service:utilService
             *
             * @description
             * Merges two arrays together using the Lodash isEqual function and returns the merged
             * array.
             *
             * @param {*[]} objValue An array to be merged into
             * @param {*[]} srcValue An array
             * @return {*[]} The result of merging the two arrays using Lodash's isEqual
             */
            self.mergingArrays = function(objValue, srcValue) {
                if (_.isArray(objValue)) {
                    return _.unionWith(objValue, srcValue, _.isEqual);
                }
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
            self.parseLinks = function(header) {
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
             * Creates an error toast with the passed error text that will disappear after 3 seconds
             *
             * @param {string} text The text for the body of the error toast
             */
            self.createErrorToast = function(text) {
                toastr.error(text, 'Error', {timeOut: 3000});
            }
            /**
             * @ngdoc method
             * @name createSuccessToast
             * @methodOf util.service:utilService
             *
             * @description
             * Creates a success toast with the passed success text that will disappear after 3 seconds
             *
             * @param {string} text The text for the body of the success toast
             */
            self.createSuccessToast = function(text) {
                toastr.success(text, 'Success', {timeOut: 3000});
            }
            /**
             * @ngdoc method
             * @name createWarningToast
             * @methodOf util.service:utilService
             *
             * @description
             * Creates a warning toast with the passed success text that will disappear after 3 seconds
             *
             * @param {string} text The text for the body of the warning toast
             */
            self.createWarningToast = function(text) {
                toastr.warning(text, 'Warning', {timeOut: 3000});
            }
            /**
             * @ngdoc method
             * @name getIRINamespace
             * @methodOf util.service:utilService
             *
             * @description
             * Gets the namespace of an IRI string.
             *
             * @param {string} iri An IRI string.
             * @return {string} The namespace of the IRI
             */
            self.getIRINamespace = function(iri) {
                var split = $filter('splitIRI')(iri);
                return split.begin + split.then;
            }
            /**
             * @ngdoc method
             * @name getIRINamespace
             * @methodOf util.service:utilService
             *
             * @description
             * Gets the namespace of an IRI string.
             *
             * @param {Object} iri An IRI string
             * @return {string} The namespace of the IRI
             */
            self.getIRILocalName = function(iri) {
                return $filter('splitIRI')(iri).end;
            }
            /**
             * @ngdoc method
             * @name createJson
             * @methodOf util.service:utilService
             *
             * @description
             * Creates an initial JSON-LD object with the passed id and starting property IRI with initial value
             * object.
             *
             * @param {string} id An IRI for the new object
             * @param {string} property A property IRI
             * @param {Object} valueObj A value object in JSON-LD. Must contain either a `@value` or a `@id` key
             * @return {Object} A JSON-LD object with an id and property with a starting value
             */
            self.createJson = function(id, property, valueObj) {
                return {
                    '@id': id,
                    [property]: [valueObj]
                }
            }
            /**
             * @ngdoc method
             * @name getDate
             * @methodOf util.service:utilService
             *
             * @description
             * Creates a new Date string in the specified format from the passed date string. Used when converting
             * date strings from the backend into other date strings.
             *
             * @param {string} dateStr A string containing date information
             * @param {string} format A string representing a format for the new date string (See MDN spec for Date)
             * @return {string} A newly formatted date string from the original date string
             */
            self.getDate = function(dateStr, format) {
                 return dateStr ? $filter('date')(new Date(dateStr), format) : '(No Date Specified)';
            }
            /**
             * @ngdoc method
             * @name condenseCommitId
             * @methodOf util.service:utilService
             *
             * @description
             * Retrieves a shortened id for from an IRI for a commit.
             *
             * @param {string} id The IRI of a commit
             * @return {string} A shortened id from the commit IRI
             */
            self.condenseCommitId = function(id) {
                return $filter('splitIRI')(id).end.substr(0, 10);
            }
            /**
             * @ngdoc method
             * @name paginatedConfigToParams
             * @methodOf util.service:utilService
             *
             * @description
             * Converts a common paginated configuration object into a $http query parameter object with
             * common query parameters for pagination. These query parameters are: sort, ascending, limit,
             * and offset.
             *
             * @param {Object} paginatedConfig A configuration object for paginated requests
             * @param {number} paginatedConfig.pageIndex The index of the page of results to retrieve
             * @param {number} paginatedConfig.limit The number of results per page
             * @param {Object} paginatedConfig.sortOption A sort option object
             * @param {string} paginatedConfig.sortOption.field A property IRI
             * @param {boolean} paginatedConfig.sortOption.asc Whether the sort should be ascending or descending
             * @return {Object} An object with converted query parameters if present in original configuration.
             */
            self.paginatedConfigToParams = function(paginatedConfig) {
                var params = {};
                if (_.has(paginatedConfig, 'sortOption.field')) {
                    params.sort = paginatedConfig.sortOption.field;
                }
                if (_.has(paginatedConfig, 'sortOption.asc')) {
                    params.ascending = paginatedConfig.sortOption.asc;
                }
                if (_.has(paginatedConfig, 'limit')) {
                    params.limit = paginatedConfig.limit;
                    if (_.has(paginatedConfig, 'pageIndex')) {
                        params.offset = paginatedConfig.pageIndex * paginatedConfig.limit;
                    }
                }
                return params;
            }
            /**
             * @ngdoc method
             * @name getResultsPage
             * @methodOf util.service:utilService
             *
             * @description
             * Calls the passed URL which repesents a call to get paginated results and returns a Promise
             * that resolves to the HTTP response if successful and calls the provided function if it
             * failed. Can optionally be cancel-able if provided a request id.
             *
             * @param {string} url The URL to make a GET call to. Expects the response to be paginated
             * @param {Function} errorFunction The optional function to call if the request fails. Default
             * function rejects with the error message from the response.
             * @param {string} [id=''] The identifier for this request
             * @return {Promise} A Promise that resolves to the HTTP response if successful
             */
            self.getResultsPage = function(url, errorFunction = self.rejectError, id = '') {
                var promise = id ? httpService.get(url, undefined, id) : $http.get(url);
                return promise.then($q.when, errorFunction);
            }
            /**
             * @ngdoc method
             * @name onError
             * @methodOf util.service:utilService
             *
             * @description
             * Rejects the provided deferred promise with the status text of the passed HTTP response object
             * if present, otherwise uses the passed default message.
             *
             * @param {Object} error A HTTP response object
             * @param {?} deferred A deferred promise created by $q.defer()
             * @param {string} defaultMessage The optional default error text for the rejection
             */
            self.onError = function(error, deferred, defaultMessage) {
                deferred.reject(_.get(error, 'status') === -1 ? '' : self.getErrorMessage(error, defaultMessage));
            }
            /**
             * @ngdoc method
             * @name rejectError
             * @methodOf util.service:utilService
             *
             * @description
             * Returns a rejected promise with the status text of the passed HTTP response object if present,
             * otherwise uses the passed default message.
             *
             * @param {Object} error A HTTP response object
             * @param {string} defaultMessage The optional default error text for the rejection
             * @return {Promise} A Promise that rejects with an error message
             */
            self.rejectError = function(error, defaultMessage) {
                return $q.reject(_.get(error, 'status') === -1 ? '' : self.getErrorMessage(error, defaultMessage));
            }
            /**
             * @ngdoc method
             * @name getErrorMessage
             * @methodOf util.service:utilService
             *
             * @description
             * Retrieves an error message from a HTTP response if available, otherwise uses the passed default
             * message.
             *
             * @param {Object} error A response from a HTTP calls
             * @param {string='Something went wrong. Please try again later.'} defaultMessage The optional message
             * to use if the response doesn't have an error message
             * @return {string} An error message for the passed HTTP response
             */
            self.getErrorMessage = function(error, defaultMessage = 'Something went wrong. Please try again later.') {
                return _.get(error, 'statusText') || defaultMessage;
            }
            /**
             * @ngdoc method
             * @name getChangesById
             * @methodOf util.service:utilService
             *
             * @description
             * Gets the list of individual statements from the provided array which have a subject matching the provided
             * id.
             *
             * @param {string} id The id which should match the subject of the statements you are looking for.
             * @param {Object[]} array The array of JSON-LD statements that you are iterating through.
             * @return {Object[]} An array of Objects, {p: string, o: string} which are the predicate and object for
             * statements which have the provided id as a subject.
             */
            self.getChangesById = function(id, array) {
                var results = [];
                var entity = angular.copy(_.find(array, {'@id': id}));
                _.forOwn(entity, (value, key) => {
                    if (key !== '@id') {
                        var actualKey = key;
                        if (key === '@type') {
                            actualKey = prefixes.rdf + 'type';
                        }
                        if (_.isArray(value)) {
                            _.forEach(value, item => results.push({p: actualKey, o: item}));
                        } else {
                            results.push({p: actualKey, o: value});
                        }
                    }
                });
                return results;
            }
            /**
             * @ngdoc method
             * @name getPredicateLocalName
             * @methodOf util.service:utilService
             *
             * @description
             * Gets the localname for the provided partialStatement Object, {p: predicateIRI}.
             *
             * @param {Object} partialStatement The partial statement that should contain, at minimum, a `p` property
             * with a value of the predicate IRI whose localname you want.
             * @return {string} The localname for the predicate provided in the partialStatement.
             */
            self.getPredicateLocalName = function(partialStatement) {
                return $filter('splitIRI')(_.get(partialStatement, 'p', '')).end;
            }
            /**
             * @ngdoc method
             * @name getIdForBlankNode
             * @methodOf util.service:utilService
             *
             * @description
             * Generates a blank node IRI using a random V4 UUID.
             *
             * @return {string} A blank node IRI that should be unique.
             */
            self.getIdForBlankNode = function() {
                return '_:mobi-bnode-' + uuid.v4();
            }
            /**
             * @ngdoc method
             * @name getSkolemizedIRI
             * @methodOf util.service:utilService
             *
             * @description
             * Generates a skolemized IRI using a random V4 UUID.
             *
             * @return {string} A skolemized IRI that should be unique.
             */
            self.getSkolemizedIRI = function() {
                return 'http://mobi.com/.well-known/genid/' + uuid.v4();
            }
            /**
             * @ngdoc method
             * @name getInputType
             * @methodOf util.service:utilService
             *
             * @description
             * Gets the input type associated with the property in the properties list provided.
             *
             * @param {string} typeIRI The IRI of the type
             * @returns {string} A string identifying the input type that should be used for the provided property.
             */
            self.getInputType = function(typeIRI) {
                switch (_.replace(typeIRI, prefixes.xsd, '')) {
                    case 'dateTime':
                    case 'dateTimeStamp':
                        return 'datetime-local';
                    case 'byte':
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
             * @methodOf util.service:utilService
             *
             * @description
             * Gets the pattern type associated with the property in the properties list provided.
             *
             * @param {string} typeIRI The IRI of the type
             * @returns {RegEx} A Regular Expression identifying the acceptable values for the provided property.
             */
            self.getPattern = function(typeIRI) {
                switch (_.replace(typeIRI, prefixes.xsd, '')) {
                    case 'dateTime':
                    case 'dateTimeStamp':
                        return REGEX.DATETIME;
                    case 'decimal':
                    case 'double':
                    case 'float':
                        return REGEX.DECIMAL;
                    case 'byte':
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
             * @name startDownload
             * @methodOf util.service:utilService
             *
             * @description
             * Starts a download of the resource at the provided URL by setting the `$window.location`.
             *
             * @param {string} url The URL to start a download from
             */
            self.startDownload = function(url) {
                $rootScope.isDownloading = true;
                $window.location = url;
            }

            function setValue(entity, propertyIRI, valueObj) {
                if (_.has(entity, "['" + propertyIRI + "']")) {
                    entity[propertyIRI].push(valueObj);
                } else {
                    _.set(entity, "['" + propertyIRI + "'][0]", valueObj);
                }
            }
            function hasValue(entity, propertyIRI, valueObj) {
                return _.some(_.get(entity, "['" + propertyIRI + "']", []), valueObj);
            }
            function removeValue(entity, propertyIRI, valueObj) {
                if (_.has(entity, "['" + propertyIRI + "']")) {
                    _.remove(entity[propertyIRI], valueObj);
                    if (entity[propertyIRI].length === 0) {
                        delete entity[propertyIRI];
                    }
                }
            }
        }
})();
