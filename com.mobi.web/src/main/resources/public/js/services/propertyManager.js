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
        .module('propertyManager', [])
        .service('propertyManagerService', propertyManagerService);

        propertyManagerService.$inject = ['$filter', '$q', '$http', 'prefixes', 'REST_PREFIX'];

        function propertyManagerService($filter, $q, $http, prefixes, REST_PREFIX) {
            var self = this;
            var prefix = REST_PREFIX + 'ontologies/';

            var rdfsAnnotations = _.map(['comment', 'label', 'seeAlso', 'isDefinedBy'], item => {
                return {
                    namespace: prefixes.rdfs,
                    localName: item
                }
            });
            var dcAnnotations = _.map(['description', 'title'], item => {
                return {
                    namespace: prefixes.dcterms,
                    localName: item
                }
            });
            self.defaultAnnotations = _.concat(rdfsAnnotations, dcAnnotations);

            self.owlAnnotations = [{namespace: prefixes.owl, localName: 'deprecated'}];
            self.skosAnnotations = _.map(['altLabel', 'changeNote', 'definition', 'editorialNote', 'example',
                'hiddenLabel', 'historyNote', 'note', 'prefLabel', 'scopeNote'], item => {
                return {
                    namespace: prefixes.skos,
                    localName: item
                }
            });

            self.classAxiomList = [
                {
                    namespace: prefixes.rdfs,
                    localName: 'subClassOf',
                    valuesKey: 'classes'
                },
                {
                    namespace: prefixes.owl,
                    localName: 'disjointWith',
                    valuesKey: 'classes'
                },
                {
                    namespace: prefixes.owl,
                    localName: 'equivalentClass',
                    valuesKey: 'classes'
                }
            ];

            self.datatypeAxiomList = [
                {
                    namespace: prefixes.rdfs,
                    localName: 'domain',
                    valuesKey: 'classes'
                },
                {
                    namespace: prefixes.rdfs,
                    localName: 'range',
                    valuesKey: 'dataPropertyRange'
                },
                {
                    namespace: prefixes.owl,
                    localName: 'equivalentProperty',
                    valuesKey: 'dataProperties'
                },
                {
                    namespace: prefixes.rdfs,
                    localName: 'subPropertyOf',
                    valuesKey: 'dataProperties'
                },
                {
                    namespace: prefixes.owl,
                    localName: 'disjointWith',
                    valuesKey: 'dataProperties'
                }
            ];

            self.objectAxiomList = [
                {
                    namespace: prefixes.rdfs,
                    localName: 'domain',
                    valuesKey: 'classes'
                },
                {
                    namespace: prefixes.rdfs,
                    localName: 'range',
                    valuesKey: 'classes'
                },
                {
                    namespace: prefixes.owl,
                    localName: 'equivalentProperty',
                    valuesKey: 'objectProperties'
                },
                {
                    namespace: prefixes.rdfs,
                    localName: 'subPropertyOf',
                    valuesKey: 'objectProperties'
                },
                {
                    namespace: prefixes.owl,
                    localName: 'inverseOf',
                    valuesKey: 'objectProperties'
                },
                {
                    namespace: prefixes.owl,
                    localName: 'disjointWith',
                    valuesKey: 'objectProperties'
                }
            ];

            self.remove = function(entity, key, index) {
                _.pullAt(entity[key], index);
                if (!entity[key].length) {
                    delete entity[key];
                }
            }

            self.add = function(entity, prop, value, type, language) {
                if (prop) {
                    var annotation = {'@value': value};
                    if (type) {
                        annotation['@type'] = type;
                    }
                    if (language) {
                        annotation['@language'] = language;
                    }
                    if (_.has(entity, prop)) {
                        entity[prop].push(annotation);
                    } else {
                        entity[prop] = [annotation];
                    }
                }
            }

            self.edit = function(entity, prop, value, index, type, language) {
                if (prop) {
                    var annotation = entity[prop][index];
                    annotation['@value'] = value;
                    if (type) {
                        annotation['@type'] = type;
                    } else {
                        _.unset(annotation, '@type');
                    }
                    if (language) {
                        annotation['@language'] = language;
                    } else {
                        _.unset(annotation, '@language');
                    }
                }
            }

            self.create = function(recordId, annotationIRIs, iri) {
                var deferred = $q.defer();
                var annotationJSON = {'@id': iri, '@type': [prefixes.owl + 'AnnotationProperty']};
                if (_.indexOf(annotationIRIs, iri) === -1) {
                    var config = {
                        params: {
                            annotationjson: annotationJSON
                        }
                    }
                    $http.post(prefix + encodeURIComponent(recordId) + '/annotations', null, config)
                        .then(response => {
                            if (_.get(response, 'status') === 200) {
                                deferred.resolve(annotationJSON);
                            } else {
                                deferred.reject(_.get(response, 'statusText'));
                            }
                        }, response => deferred.reject(_.get(response, 'statusText')));
                } else {
                    deferred.reject('This ontology already has an OWL Annotation declared with that IRI.');
                }
                return deferred.promise;
            }
        }
})();
