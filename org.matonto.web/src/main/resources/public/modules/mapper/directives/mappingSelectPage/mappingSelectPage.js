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
         * @name mappingSelectPage
         *
         * @description
         * The `mappingSelectPage` module only provides the `mappingSelectPage` directive which creates
         * a Bootstrap `row` with {@link block.directive:block blocks} for editing the selecting and
         * previewing a mapping.
         */
        .module('mappingSelectPage', [])
        /**
         * @ngdoc directive
         * @name mappingSelectPage.directive:mappingSelectPage
         * @scope
         * @restrict E
         * @requires mapperState.service:mapperStateService
         * @requires mappingManager.service:mappingManagerService
         *
         * @description
         * `mappingSelectPage` is a directive that creates a Bootstrap `row` div with two columns for selecting
         * and previewing a mapping. The left column contains
         * a {@link mappingListBlock.directive:mappingListBlock mappingListBlock} for selecting the current
         * {@link mapperState.service:mapperStateService#mapping mapping}. The right column contains a
         * {@link mappingPreview.directive:mappingPreview mappingPreview} of the selected mapping and buttons
         * for editing running, duplicating, and downloading the mapping. The directive is replaced by the
         * contents of its template.
         */
        .directive('mappingSelectPage', mappingSelectPage);

        mappingSelectPage.$inject = ['mapperStateService', 'mappingManagerService', 'utilService'];

        function mappingSelectPage(mapperStateService, mappingManagerService, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/mapper/directives/mappingSelectPage/mappingSelectPage.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.util = utilService;

                    dvm.run = function() {
                        dvm.state.mappingSearchString = '';
                        dvm.state.highlightIndexes = dvm.state.getMappedColumns();
                        dvm.loadOntologyAndContinue();
                    }
                    dvm.edit = function() {
                        dvm.state.mappingSearchString = '';
                        dvm.state.editMapping = true;
                        dvm.loadOntologyAndContinue();
                    }
                    dvm.download = function() {
                        dvm.state.displayDownloadMappingOverlay = true;
                    }
                    dvm.duplicate = function() {
                        dvm.state.displayCreateMappingOverlay = true;
                    }
                    dvm.loadOntologyAndContinue = function() {
                        dvm.mm.getSourceOntologies(dvm.mm.getSourceOntologyInfo(dvm.state.mapping.jsonld)).then(ontologies => {
                            if (dvm.mm.areCompatible(dvm.state.mapping, ontologies)) {
                                dvm.state.sourceOntologies = ontologies;
                                var usedClassIds = _.map(dvm.mm.getAllClassMappings(dvm.state.mapping.jsonld), dvm.mm.getClassIdByMapping);
                                dvm.state.availableClasses = _.filter(dvm.state.getClasses(ontologies), clazz => !_.includes(usedClassIds, clazz.classObj['@id']));
                                dvm.state.mappingSearchString = '';
                                dvm.state.step = dvm.state.fileUploadStep;
                            } else {
                                dvm.state.invalidOntology = true;
                            }
                        });
                    }
                }
            }
        }
})();
