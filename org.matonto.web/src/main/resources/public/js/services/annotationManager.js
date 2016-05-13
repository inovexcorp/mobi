(function() {
    'use strict';

    var newAnnotationString = 'New OWL AnnotationProperty';

    angular
        .module('annotationManager', ['responseObj', 'splitIRI', 'prefixes'])
        .service('annotationManagerService', annotationManagerService)
        .filter('showAnnotations', showAnnotations);

        annotationManagerService.$inject = ['$rootScope', '$filter', '$q', '$http', 'responseObj', 'prefixes'];

        function annotationManagerService($rootScope, $filter, $q, $http, responseObj, prefixes) {
            var self = this;

            var rdfsAnnotations = _.map(['comment', 'label', 'seeAlso', 'isDefinedBy'], function(item) {
                return {
                    'namespace': prefixes.rdfs,
                    'localName': item
                }
            });
            var owlAnnotations = _.map(['deprecated', 'versionInfo', 'priorVersion', 'backwardCompatibleWith', 'incompatibleWith'], function(item) {
                return {
                    'namespace': prefixes.owl,
                    'localName': item
                }
            });
            var dcAnnotations = _.map(['description', 'title'], function(item) {
                return {
                    'namespace': prefixes.dc,
                    'localName': item
                }
            });
            var defaultAnnotations = _.concat(angular.copy(rdfsAnnotations), angular.copy(owlAnnotations), angular.copy(dcAnnotations));

            self.getDefaultAnnotations = function() {
                return angular.copy(defaultAnnotations);
            }

            self.remove = function(entity, key, index) {
                entity[key].splice(index, 1);

                if(!entity[key].length) {
                    delete entity[key];
                }
            }

            self.add = function(entity, select, value) {
                if(responseObj.validateItem(select)) {
                    var prop = responseObj.getItemIri(select);
                    var annotation = {'@value': value};
                    if(_.has(entity, prop)) {
                        entity[prop].push(annotation);
                    } else {
                        entity[prop] = [annotation];
                    }
                }
            }

            self.edit = function(entity, select, value, index) {
                entity[select][index]['@value'] = value;
            }

            self.create = function(ontology, iri) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var annotationjson = {'@id': iri, '@type': [prefixes.owl + 'AnnotationProperty']};
                if(_.findIndex(ontology.matonto.jsAnnotations, annotationjson) === -1) {
                    var config = {
                        params: {
                            annotationjson: annotationjson
                        }
                    }
                    $http.post('/matontorest/ontologies/' + encodeURIComponent(ontology['@id']) + '/annotations', null, config)
                        .then(function(response) {
                            if(_.get(response, 'status') === 200) {
                                var split = $filter('splitIRI')(iri);
                                ontology.matonto.annotations.push({namespace: split.begin + split.then, localName: split.end});
                                ontology.matonto.jsAnnotations.push(annotationjson);
                                deferred.resolve(response);
                            } else {
                                deferred.reject(_.get(response, 'statusText'));
                            }
                        }, function(response) {
                            deferred.reject(_.get(response, 'statusText'));
                        })
                        .then(function() {
                            $rootScope.showSpinner = false;
                        });
                } else {
                    deferred.reject('This ontology already has an OWL Annotation declared with that IRI.');
                }

                return deferred.promise;
            }
        }

        showAnnotations.$inject = ['responseObj'];

        function showAnnotations(responseObj) {
            return function(entity, annotations) {
                var arr = [];

                if(_.isArray(annotations)) {
                    _.forEach(annotations, function(annotation) {
                        if(responseObj.validateItem(annotation)) {
                            var annotationIri = responseObj.getItemIri(annotation);
                            if(_.has(entity, annotationIri)) {
                                arr.push(annotation);
                            }
                        }
                    });
                }

                return arr;
            }
        }
})();