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
        .module('annotationManager', [])
        .service('annotationManagerService', annotationManagerService);

        annotationManagerService.$inject = ['$rootScope', '$filter', '$q', '$http', 'prefixes'];

        function annotationManagerService($rootScope, $filter, $q, $http, prefixes) {
            var self = this;
            var prefix = '/matontorest/ontologies/';

            var rdfsAnnotations = _.map(['comment', 'label', 'seeAlso', 'isDefinedBy'], function(item) {
                return {
                    'namespace': prefixes.rdfs,
                    'localName': item
                }
            });
            var owlAnnotations = _.map(['deprecated', 'versionInfo', 'priorVersion', 'backwardCompatibleWith',
                'incompatibleWith'], function(item) {
                return {
                    'namespace': prefixes.owl,
                    'localName': item
                }
            });
            var dcAnnotations = _.map(['description', 'title'], function(item) {
                return {
                    'namespace': prefixes.dcterms,
                    'localName': item
                }
            });
            var defaultAnnotations = _.concat(angular.copy(rdfsAnnotations), angular.copy(owlAnnotations),
                angular.copy(dcAnnotations));

            self.getDefaultAnnotations = function() {
                return angular.copy(defaultAnnotations);
            }

            self.remove = function(entity, key, index) {
                _.pullAt(entity[key], index);
                if (!entity[key].length) {
                    delete entity[key];
                }
            }

            self.add = function(entity, prop, value) {
                if (prop) {
                    var annotation = {'@value': value};
                    if (_.has(entity, prop)) {
                        entity[prop].push(annotation);
                    } else {
                        entity[prop] = [annotation];
                    }
                }
            }

            self.edit = function(entity, prop, value, index) {
                if (prop) {
                    entity[prop][index]['@value'] = value;
                }
            }

            self.create = function(ontologyId, annotationIRIs, iri) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var annotationJSON = {'@id': iri, '@type': [prefixes.owl + 'AnnotationProperty']};
                if (_.indexOf(annotationIRIs, iri) === -1) {
                    var config = {
                        params: {
                            annotationjson: annotationJSON
                        }
                    }
                    $http.post(prefix + encodeURIComponent(ontologyId) + '/annotations', null, config)
                        .then(response => {
                            if (_.get(response, 'status') === 200) {
                                deferred.resolve(annotationJSON);
                            } else {
                                deferred.reject(_.get(response, 'statusText'));
                            }
                        }, response => {
                            deferred.reject(_.get(response, 'statusText'));
                        })
                        .then(() => {
                            $rootScope.showSpinner = false;
                        });
                } else {
                    deferred.reject('This ontology already has an OWL Annotation declared with that IRI.');
                    $rootScope.showSpinner = false;
                }
                return deferred.promise;
            }
        }
})();