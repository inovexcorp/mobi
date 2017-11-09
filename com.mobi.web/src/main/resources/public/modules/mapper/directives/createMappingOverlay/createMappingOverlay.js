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
         * @name createMappingOverlay
         *
         * @description
         * The `createMappingOverlay` module only provides the `createMappingOverlay` directive which creates
         * an overlay with functionality to add a title, description, and keywords to a new MappingRecord.
         */
        .module('createMappingOverlay', [])
        /**
         * @ngdoc directive
         * @name createMappingOverlay.directive:createMappingOverlay
         * @scope
         * @restrict E
         * @requires mappingManager.service:mappingManagerService
         * @requires mapperState.service:mapperStateService
         *
         * @description
         * `createMappingOverlay` is a directive that creates an overlay with three inputs for metadata about a
         * new MappingRecord: a text input for the title, a {@link textArea.directive:textArea} for the description,
         * and a {@link keywordSelect.directive:keywordSelect}. The directive is replaced by the contents of its
         * template.
         */
        .directive('createMappingOverlay', createMappingOverlay);

        createMappingOverlay.$inject = ['mappingManagerService', 'mapperStateService']

        function createMappingOverlay(mappingManagerService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    var state = mapperStateService;
                    var mm = mappingManagerService;

                    dvm.errorMessage = '';
                    dvm.newMapping = state.createMapping();
                    if (state.mapping) {
                        dvm.newMapping.record = angular.copy(state.mapping.record);
                        dvm.newMapping.jsonld = angular.copy(state.mapping.jsonld);
                        dvm.newMapping.ontology = angular.copy(state.mapping.ontology);
                    }

                    dvm.cancel = function() {
                        state.editMapping = false;
                        state.newMapping = false;
                        state.displayCreateMappingOverlay = false;
                    }
                    dvm.continue = function() {
                        var newId = mm.getMappingId(dvm.newMapping.record.title);
                        if (dvm.newMapping.jsonld.length === 0) {
                            dvm.newMapping.jsonld = mm.createNewMapping(newId);
                            dvm.sourceOntologies = [];
                            dvm.availableClasses = [];
                            nextStep();
                        } else {
                            dvm.newMapping.jsonld = mm.copyMapping(dvm.newMapping.jsonld, newId);
                            var sourceOntologyInfo = mm.getSourceOntologyInfo(dvm.newMapping.jsonld);
                            mm.getSourceOntologies(sourceOntologyInfo)
                                .then(ontologies => {
                                    if (mm.areCompatible(dvm.newMapping.jsonld, ontologies)) {
                                        state.sourceOntologies = ontologies;
                                        state.availableClasses = state.getClasses(ontologies);
                                        nextStep();
                                    } else {
                                        onError('The selected mapping is incompatible with its source ontologies');
                                    }
                                }, () => onError('Error retrieving mapping'));
                        }
                    }

                    function nextStep() {
                        state.mapping = dvm.newMapping;
                        dvm.errorMessage = '';
                        state.mapping.difference.additions = angular.copy(state.mapping.jsonld);
                        state.mappingSearchString = '';
                        state.step = state.fileUploadStep;
                        state.displayCreateMappingOverlay = false;
                    }
                    function onError(message) {
                        dvm.errorMessage = message;
                    }
                },
                templateUrl: 'modules/mapper/directives/createMappingOverlay/createMappingOverlay.html'
            }
        }
})();
