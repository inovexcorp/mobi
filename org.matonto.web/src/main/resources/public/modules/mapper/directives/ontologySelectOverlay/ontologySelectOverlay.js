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
         * @name ontologySelectOverlay
         *
         * @description 
         * The `ontologySelectOverlay` module only provides the `ontologySelectOverlay` directive 
         * which creates an overlay with functionality to select an ontology.
         */
        .module('ontologySelectOverlay', [])
        /**
         * @ngdoc directive
         * @name ontologySelectOverlay.directive:ontologySelectOverlay
         * @scope
         * @restrict E
         * @requires  $q
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description 
         * `ontologySelectOverlay` is a directive that creates an overlay containing a select with
         * all the ontologies saved in the repository along with an 
         * {@link ontologyPreview.directive:ontologyPreview ontologyPreview} of the currently selected ontology. 
         * The directive is replaced by the contents of its template.
         */
        .directive('ontologySelectOverlay', ontologySelectOverlay);

        ontologySelectOverlay.$inject = ['$q', 'ontologyManagerService', 'mapperStateService', 'mappingManagerService'];

        function ontologySelectOverlay($q, ontologyManagerService, mapperStateService, mappingManagerService) {
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

                    dvm.ontologyIds = _.union(dvm.om.ontologyIds, _.map(dvm.om.list, 'ontologyId'));
                    dvm.ontologyObjs = [];
                    dvm.selectedOntology = undefined;
                    dvm.selectedOntologyId = '';

                    var sourceOntology;
                    if (dvm.mm.sourceOntologies.length) {
                        var sourceOntology = dvm.mm.getSourceOntology(dvm.mm.mapping.jsonld);
                        if (sourceOntology) {
                            dvm.ontologyObjs.push(sourceOntology);
                            dvm.selectedOntology = angular.copy(sourceOntology);
                            dvm.selectedOntologyId = dvm.selectedOntology.id;
                        }
                    }
                    
                    dvm.isOpen = function(ontologyId) {
                        return _.findIndex(dvm.ontologyObjs, {id: ontologyId}) >= 0;
                    }
                    dvm.getOntology = function(ontologyId) {
                        var deferred = $q.defer();
                        var ontology = _.find(dvm.ontologyObjs, {id: ontologyId});
                        if (!ontology) {
                            dvm.mm.getOntology(ontologyId).then(ontology => {
                                dvm.ontologyObjs.push(ontology);
                                deferred.resolve(ontology);
                            });
                        } else {
                            deferred.resolve(ontology);
                        }
                        deferred.promise.then(response => {
                            dvm.selectedOntology = response;
                        });
                    }
                    dvm.getName = function(ontologyId) {
                        var ontology = _.find(dvm.ontologyObjs, {id: ontologyId});
                        if (ontology) {
                            return dvm.om.getEntityName(dvm.om.getOntologyEntity(ontology.entities));
                        } else {
                            return dvm.om.getBeautifulIRI(ontologyId);
                        }
                    }

                    dvm.continue = function() {
                        if (dvm.state.changeOntology) {
                            dvm.state.cacheSourceOntologies();
                        }
                        if (dvm.state.getCachedSourceOntologyId() !== dvm.selectedOntologyId) {
                            dvm.mm.mapping.jsonld = dvm.mm.setSourceOntology(dvm.mm.mapping.jsonld, dvm.selectedOntologyId);                        
                            dvm.mm.sourceOntologies = [dvm.selectedOntology];
                            dvm.om.getImportedOntologies(dvm.selectedOntologyId).then(response => {
                                var importedOntologies = _.map(response, obj => {
                                    return {id: obj.id, entities: obj.ontology};
                                });
                                dvm.mm.sourceOntologies = _.concat(dvm.mm.sourceOntologies, importedOntologies);
                            });
                        }

                        dvm.state.step = dvm.state.startingClassSelectStep;
                    }

                    dvm.back = function() {
                        if (dvm.state.changeOntology) {
                            dvm.state.restoreCachedSourceOntologies();
                            dvm.state.changeOntology = false;
                            dvm.state.step = dvm.state.editMappingStep;
                        } else {
                            dvm.mm.mapping.jsonld = dvm.mm.setSourceOntology(dvm.mm.mapping.jsonld, '');                        
                            dvm.mm.sourceOntologies = [];
                            dvm.state.step = dvm.state.fileUploadStep;
                        }
                    }
                },
                templateUrl: 'modules/mapper/directives/ontologySelectOverlay/ontologySelectOverlay.html'
            }
        }
})();
