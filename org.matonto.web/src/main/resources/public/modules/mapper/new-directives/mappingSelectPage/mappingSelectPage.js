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
        .module('mappingSelectPage', [])
        .directive('mappingSelectPage', mappingSelectPage);

        mappingSelectPage.$inject = ['$q', 'mapperStateService', 'mappingManagerService', 'ontologyManagerService'];

        function mappingSelectPage($q, mapperStateService, mappingManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/mapper/new-directives/mappingSelectPage/mappingSelectPage.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.ontologyExists = function() {
                        var ids = _.union(dvm.om.ontologyIds, _.map(dvm.om.list, 'ontologyId'));
                        return _.includes(ids, dvm.mm.getSourceOntologyId(_.get(dvm.mm.mapping, 'jsonld')));
                    }
                    dvm.run = function() {
                        dvm.state.mappingSearchString = '';
                        loadOntologyAndContinue();
                    }
                    dvm.edit = function() {
                        dvm.state.mappingSearchString = '';
                        dvm.state.editMapping = true;
                        loadOntologyAndContinue();
                    }
                    dvm.createMapping = function() {
                        dvm.state.createMapping();
                        dvm.state.displayCreateMapping = true;
                    }
                    dvm.deleteMapping = function() {
                        dvm.state.displayDeleteMappingConfirm = true;
                    }
                    dvm.downloadMapping = function() {
                        dvm.state.displayDownloadMapping = true;
                    }
                    function loadOntologyAndContinue() {
                        var deferred = $q.defer();
                        var ontologyId = dvm.mm.getSourceOntologyId(dvm.mm.mapping.jsonld);
                        var ontology = _.find(dvm.om.list, {ontologyId: ontologyId});
                        if (ontology) {
                            var obj = _.pick(ontology, ['ontologyId', 'ontology']);
                            deferred.resolve({id: obj.ontologyId, entities: obj.ontology});
                        } else {
                            dvm.mm.getOntology(ontologyId).then(ontology => {
                                deferred.resolve(ontology);
                            });
                        }
                        deferred.promise.then(ontology => {
                            dvm.om.getImportedOntologies(ontology.id).then(imported => {
                                var importedOntologies = _.map(imported, obj => {
                                    return {id: obj.id, entities: obj.ontology};
                                });
                                dvm.mm.sourceOntologies = _.concat(ontology, importedOntologies);
                                if (dvm.mm.areCompatible()) {
                                    dvm.state.step = dvm.state.fileUploadStep;                                
                                } else {
                                    dvm.state.invalidOntology = true;
                                }
                            });
                        });
                    }
                }
            }
        }
})();
