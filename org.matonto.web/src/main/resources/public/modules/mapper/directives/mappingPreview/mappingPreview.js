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
         * @name mappingPreview
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         *
         * @description 
         * The `mappingPreview` module only provides the `mappingPreview` directive which creates
         * a "boxed" area with a preview of a mapping and a button to select it.
         */
        .module('mappingPreview', ['prefixes', 'mappingManager', 'mapperState', 'ontologyManager'])
        /**
         * @ngdoc directive
         * @name mappingPreview.directive:mappingPreview
         * @scope
         * @restrict E
         * @requires  $q
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description 
         * `mappingPreview` is a directive that creates a "boxed" div with a preview of a mapping with 
         * its source ontology and all its mapped classes and properties. It also provides a button to
         * select the mapping for mapping delimited data. The directive is replaced by the contents of 
         * its template.
         */
        .directive('mappingPreview', mappingPreview);

        mappingPreview.$inject = ['$q', 'prefixes', 'mappingManagerService', 'mapperStateService', 'ontologyManagerService'];

        function mappingPreview($q, prefixes, mappingManagerService, mapperStateService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.useMapping = function() {
                        var deferred = $q.defer();
                        dvm.state.editMapping = true;
                        dvm.state.newMapping = false;
                        var ontologyId = dvm.mm.getSourceOntologyId(dvm.mm.mapping.jsonld);
                        var ontology = _.find(dvm.om.getList(), {'@id': ontologyId});
                        if (ontology) {
                            deferred.resolve(ontology);
                        } else {
                            dvm.om.getThenRestructure(ontologyId).then(ontology => {
                                deferred.resolve(ontology);
                            });
                        }
                        deferred.promise.then(ontology => {
                            if (isValid(ontology)) {
                                dvm.om.getImportedOntologies(ontology['@id']).then(imported => {
                                    dvm.mm.sourceOntologies = _.concat(ontology, imported);
                                    dvm.state.step = dvm.state.fileUploadStep;
                                });
                            } else {
                                dvm.state.invalidOntology = true;
                            }
                        });
                    }
                    dvm.ontologyExists = function() {
                        var objs = angular.copy(dvm.om.getList());
                        var ids = _.union(dvm.om.getOntologyIds(), _.map(objs, '@id'));
                        return _.includes(ids, dvm.mm.getSourceOntologyId(dvm.mm.mapping.jsonld));
                    }
                    dvm.getClassName = function(classMapping) {
                        return dvm.om.getBeautifulIRI(dvm.mm.getClassIdByMapping(classMapping));
                    }
                    dvm.getPropName = function(propMapping) {
                        return dvm.om.getBeautifulIRI(dvm.mm.getPropIdByMapping(propMapping));
                    }
                    dvm.getColumnIndex = function(propMapping) {
                        return parseInt(propMapping[prefixes.delim + 'columnIndex'][0]['@value'], 10);
                    }
                    function isValid(ontology) {
                        var invalid = _.some(dvm.mm.getAllClassMappings(dvm.mm.mapping.jsonld), classMapping => {
                            var classId = classMapping[prefixes.delim + 'mapsTo'][0]['@id'];
                            if (!dvm.om.getClass(ontology, classId)) {
                                return true;
                            }
                            return _.some(dvm.mm.getPropMappingsByClass(dvm.mm.mapping.jsonld, classMapping['@id']), propMapping => {
                                var propId = propMapping[prefixes.delim + 'hasProperty'][0]['@id'];
                                var propObj = dvm.om.getClassProperty(ontology, classId, propId);
                                if (!propObj) {
                                    return true;
                                } else {
                                    if (dvm.om.isObjectProperty(propObj['@type']) && dvm.mm.isDataMapping(propMapping)) {
                                        return true;
                                    }
                                    if (!dvm.om.isObjectProperty(propObj['@type']) && dvm.mm.isObjectMapping(propMapping)) {
                                        return true;
                                    }
                                }
                            });
                        });
                        return !invalid;
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingPreview/mappingPreview.html'
            }
        }
})();
