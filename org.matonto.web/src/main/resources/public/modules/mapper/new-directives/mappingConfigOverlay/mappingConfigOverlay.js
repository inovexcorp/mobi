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
        .module('mappingConfigOverlay', [])
        .directive('mappingConfigOverlay', mappingConfigOverlay);

        mappingConfigOverlay.$inject = ['ontologyManagerService', 'mapperStateService', 'mappingManagerService'];

        function mappingConfigOverlay(ontologyManagerService, mapperStateService, mappingManagerService) {
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
                    dvm.selectedOntology = undefined;
                    dvm.selectedOntologyClosure = [];
                    dvm.classes = [];
                    dvm.selectedBaseClass = undefined;

                    if (dvm.mm.sourceOntologies.length) {
                        var sourceOntology = dvm.mm.getSourceOntology(dvm.mm.mapping.jsonld);
                        if (sourceOntology) {
                            dvm.selectedOntologyId = sourceOntology.id;
                            dvm.selectedOntology = sourceOntology;
                            dvm.selectedOntologyClosure = dvm.mm.sourceOntologies;
                            _.set(dvm.ontologies, encodeURIComponent(dvm.selectedOntologyId), dvm.mm.sourceOntologies);
                            dvm.classes = getClasses(dvm.mm.sourceOntologies);
                            var classId = dvm.mm.getClassIdByMapping(dvm.mm.getBaseClass(dvm.mm.mapping.jsonld));
                            dvm.selectedBaseClass = _.find(dvm.classes, {'@id': classId});
                        }
                    }
                    
                    dvm.selectOntology = function(ontologyId) {
                        if (_.has(dvm.ontologies, encodeURIComponent(ontologyId))) {
                            dvm.selectedOntologyId = ontologyId;
                            dvm.selectedOntology = getOntology(ontologyId);
                            dvm.selectedOntologyClosure = getOntologyClosure(ontologyId);
                            dvm.classes = getClasses(_.get(dvm.ontologies, encodeURIComponent(dvm.selectedOntologyId)));
                            dvm.selectedBaseClass = undefined;
                        } else {
                            dvm.mm.getOntology(ontologyId).then(ontology => {
                                dvm.selectedOntologyId = ontologyId;
                                _.set(dvm.ontologies, encodeURIComponent(dvm.selectedOntologyId), [ontology]);
                                dvm.selectedOntology = ontology;
                                return dvm.om.getImportedOntologies(dvm.selectedOntologyId);
                            }).then(imported => {
                                _.forEach(imported, obj => {
                                    var ontology = {id: obj.id, entities: obj.ontology};
                                    getOntologyClosure(dvm.selectedOntologyId).push(ontology);
                                });
                                dvm.selectedOntologyClosure = getOntologyClosure(dvm.selectedOntologyId);
                                dvm.classes = getClasses(dvm.selectedOntologyClosure);
                                dvm.selectedBaseClass = undefined;
                            });
                        }
                    }
                    dvm.getName = function(ontologyId) {
                        if (_.has(dvm.ontologies, encodeURIComponent(ontologyId))) {
                            return dvm.om.getEntityName(dvm.om.getOntologyEntity(getOntology(ontologyId).entities));
                        } else {
                            return dvm.om.getBeautifulIRI(ontologyId);
                        }
                    }
                    dvm.set = function() {
                        if (dvm.mm.getSourceOntologyId(dvm.mm.mapping.jsonld)) {
                            dvm.mm.mapping.jsonld = dvm.mm.createNewMapping();
                        }
                        dvm.mm.sourceOntologies = getOntologyClosure(dvm.selectedOntologyId);
                        dvm.mm.mapping.jsonld = dvm.mm.setSourceOntology(dvm.mm.mapping.jsonld, dvm.selectedOntologyId);
                        var ontology = dvm.mm.findSourceOntologyWithClass(dvm.selectedBaseClass['@id']);
                        dvm.mm.mapping.jsonld = dvm.mm.addClass(dvm.mm.mapping.jsonld, ontology.entities, dvm.selectedBaseClass['@id']);
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = _.get(dvm.mm.getAllClassMappings(dvm.mm.mapping.jsonld), "[0]['@id']");
                        dvm.state.setAvailableProps(dvm.state.selectedClassMappingId);
                        dvm.state.displayMappingConfig = false;
                    }
                    dvm.cancel = function() {
                        dvm.state.displayMappingConfig = false;
                    }
                    function getClasses(ontologies) {
                        var classes = [];
                        _.forEach(ontologies, ontology => {
                            classes = _.concat(classes, dvm.om.getClasses(ontology.entities));
                        });
                        return classes;
                    }
                    function getOntologyClosure(ontologyId) {
                        return _.get(dvm.ontologies, encodeURIComponent(ontologyId));
                    }
                    function getOntology(ontologyId) {
                        return _.find(getOntologyClosure(ontologyId), {'id': ontologyId});
                    }
                },
                templateUrl: 'modules/mapper/new-directives/mappingConfigOverlay/mappingConfigOverlay.html'
            }
        }
})();