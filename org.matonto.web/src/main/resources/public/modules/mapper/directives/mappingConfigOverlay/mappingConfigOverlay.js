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
         * @name mappingConfigOverlay
         *
         * @description
         * The `mappingConfigOverlay` module only provides the `mappingConfigOverlay` directive which creates
         * an overlay with functionality to edit the configuration of the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('mappingConfigOverlay', [])
        /**
         * @ngdoc directive
         * @name mappingConfigOverlay.directive:mappingConfigOverlay
         * @scope
         * @restrict E
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description
         * `mappingConfigOverlay` is a directive that creates an overlay with functionality to edit the
         * configuration of the current {@link mapperState.service:mapperStateService#mapping mapping}.
         * The configuration consists of the source ontology and the base class. If editing a mapping that already
         * has those two set, a new mapping will be created with the new settings. The directive is replaced by
         * the contents of its template.
         */
        .directive('mappingConfigOverlay', mappingConfigOverlay);

        mappingConfigOverlay.$inject = ['utilService', 'ontologyManagerService', 'mapperStateService', 'mappingManagerService'];

        function mappingConfigOverlay(utilService, ontologyManagerService, mapperStateService, mappingManagerService) {
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
                    dvm.errorMessage = '';

                    dvm.ontologyIds = _.union(dvm.om.ontologyIds, _.map(dvm.om.list, 'ontologyId'));
                    dvm.ontologies = {};
                    dvm.selectedOntologyId = '';
                    dvm.classes = [];
                    dvm.selectedBaseClass = undefined;

                    if (dvm.state.sourceOntologies.length) {
                        var sourceOntology = dvm.mm.getSourceOntology(dvm.state.mapping.jsonld, dvm.state.sourceOntologies);
                        if (sourceOntology) {
                            dvm.selectedOntologyId = sourceOntology.id;
                            _.set(dvm.ontologies, encodeURIComponent(dvm.selectedOntologyId), dvm.state.sourceOntologies);
                            dvm.classes = getClasses(dvm.state.sourceOntologies);
                            var classId = dvm.mm.getClassIdByMapping(dvm.mm.getBaseClass(dvm.state.mapping.jsonld));
                            dvm.selectedBaseClass = _.get(_.find(dvm.classes, {classObj: {'@id': classId}}), 'classObj');
                        }
                    }

                    dvm.selectOntology = function(ontologyId) {
                        if (_.has(dvm.ontologies, encodeURIComponent(ontologyId))) {
                            dvm.selectedOntologyId = ontologyId;
                            dvm.classes = getClasses(dvm.getOntologyClosure(dvm.selectedOntologyId));
                            dvm.selectedBaseClass = undefined;
                        } else {
                            dvm.mm.getOntology(ontologyId).then(ontology => {
                                dvm.selectedOntologyId = ontologyId;
                                _.set(dvm.ontologies, encodeURIComponent(dvm.selectedOntologyId), [ontology]);
                                return dvm.om.getImportedOntologies(dvm.selectedOntologyId);
                            }, onError).then(imported => {
                                _.forEach(imported, obj => {
                                    var ontology = {id: obj.id, entities: obj.ontology};
                                    dvm.getOntologyClosure(dvm.selectedOntologyId).push(ontology);
                                });
                                dvm.classes = getClasses(dvm.getOntologyClosure(dvm.selectedOntologyId));
                                dvm.selectedBaseClass = undefined;
                            }, onError);
                        }
                    }
                    dvm.getName = function(ontologyId) {
                        if (_.has(dvm.ontologies, encodeURIComponent(ontologyId))) {
                            return dvm.om.getEntityName(dvm.om.getOntologyEntity(dvm.getOntology(ontologyId).entities));
                        } else {
                            return utilService.getBeautifulIRI(ontologyId);
                        }
                    }
                    dvm.getOntology = function(ontologyId) {
                        return _.find(dvm.getOntologyClosure(ontologyId), {'id': ontologyId});
                    }
                    dvm.getOntologyClosure = function(ontologyId) {
                        return _.get(dvm.ontologies, encodeURIComponent(ontologyId));
                    }
                    dvm.set = function() {
                        var originalSourceOntologyId = dvm.mm.getSourceOntologyId(dvm.state.mapping.jsonld);
                        if (originalSourceOntologyId !== dvm.selectedOntologyId || _.get(dvm.selectedBaseClass, '@id', '') !== dvm.mm.getClassIdByMapping(dvm.mm.getBaseClass(dvm.state.mapping.jsonld))) {
                            if (originalSourceOntologyId) {
                                dvm.state.mapping.jsonld = dvm.mm.createNewMapping(dvm.state.mapping.id);
                                dvm.state.invalidProps = [];
                            }
                            dvm.state.sourceOntologies = dvm.getOntologyClosure(dvm.selectedOntologyId);
                            dvm.mm.setSourceOntology(dvm.state.mapping.jsonld, dvm.selectedOntologyId);
                            var ontology = dvm.mm.findSourceOntologyWithClass(dvm.selectedBaseClass['@id'], dvm.state.sourceOntologies);
                            dvm.mm.addClass(dvm.state.mapping.jsonld, ontology.entities, dvm.selectedBaseClass['@id']);
                            dvm.state.resetEdit();
                            dvm.state.selectedClassMappingId = _.get(dvm.mm.getAllClassMappings(dvm.state.mapping.jsonld), "[0]['@id']");
                            dvm.state.setAvailableProps(dvm.state.selectedClassMappingId);
                        }

                        dvm.state.displayMappingConfigOverlay = false;
                    }
                    dvm.cancel = function() {
                        dvm.state.displayMappingConfigOverlay = false;
                    }
                    function getClasses(ontologies) {
                        var classes = [];
                        _.forEach(ontologies, ontology => {
                            classes = _.concat(classes, _.map(dvm.om.getClasses(ontology.entities), classObj => {
                                return {ontologyId: ontology.id, classObj};
                            }));
                        });
                        return classes;
                    }
                    function onError(errorMessage) {
                        dvm.errorMessage = errorMessage;
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingConfigOverlay/mappingConfigOverlay.html'
            }
        }
})();
