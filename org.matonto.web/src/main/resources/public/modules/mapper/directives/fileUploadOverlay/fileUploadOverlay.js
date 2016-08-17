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
         * @name fileUploadOverlay
         *
         * @description 
         * The `fileUploadOverlay` module only provides the `fileUploadOverlay` directive which creates
         * an overlay with functionality to upload a delimited file to use for mapping.
         */
        .module('fileUploadOverlay', [])
        /**
         * @ngdoc directive
         * @name fileUploadOverlay.directive:fileUploadOverlay
         * @scope
         * @restrict E
         * @requires  prefixes.service:prefixes
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  delimitedManager.service:delimitedManagerService
         *
         * @description 
         * `fileUploadOverlay` is a directive that creates an overlay with a form to upload a delimited 
         * file. If a pre-existing mapping is being used and there are data mappings to column indexes 
         * that do not exist in the uploaded file, an error is shown and a list of the problem data 
         * mappings is rendered. If a pre-existing mapping is being used, clicking the "Continue" button
         * will jump ahead in the mapper steps. If a new mapping is being created, it procedes to the 
         * next step. The directive is replaced by the contents of its template.
         */
        .directive('fileUploadOverlay', fileUploadOverlay);

        fileUploadOverlay.$inject = ['$q', 'prefixes', 'delimitedManagerService', 'mapperStateService', 'mappingManagerService', 'ontologyManagerService'];

        function fileUploadOverlay($q, prefixes, delimitedManagerService, mapperStateService, mappingManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                link: function(scope, el, attrs, ctrl) {
                    if (delimitedManagerService.fileObj) {
                        ctrl.setUploadValidity(true);
                    } else {
                        ctrl.setUploadValidity(false);
                    }
                },
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.dm = delimitedManagerService;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.errorMessage = '';

                    dvm.isExcel = function() {
                        var fileName = _.get(dvm.dm.fileObj, 'name');
                        return _.includes(fileName, 'xls');
                    }
                    dvm.getDataMappingName = function(dataMappingId) {
                        var ontology = dvm.mm.getSourceOntology(dvm.mm.mapping.jsonld);
                        var propId = dvm.mm.getPropIdByMappingId(dvm.mm.mapping.jsonld, dataMappingId);
                        var classId = dvm.mm.getClassIdByMapping(
                            dvm.mm.findClassWithDataMapping(dvm.mm.mapping.jsonld, dataMappingId)
                        );
                        var propName = dvm.om.getEntityName(dvm.om.getClassProperty(ontology.entities, classId, propId));
                        var className = dvm.om.getEntityName(dvm.om.getEntity(ontology.entities, classId));
                        return dvm.mm.getPropMappingTitle(className, propName);
                    }
                    dvm.upload = function() {
                        dvm.dm.upload(dvm.dm.fileObj).then(data => {
                            dvm.dm.fileName = data;
                            dvm.setUploadValidity(true);
                            return dvm.dm.previewFile(100);
                        }, errorMessage => $q.reject(errorMessage)).then(() => {
                            if (!dvm.state.newMapping) {
                                testColumns();
                            }
                        }, onError);
                    }
                    dvm.cancel = function() {
                        dvm.dm.reset();
                        if (dvm.state.newMapping) {
                            dvm.state.step = 0;
                            dvm.state.editMappingName = true;
                        } else {
                            dvm.state.initialize();
                        }
                    }
                    dvm.continue = function() {
                        if (dvm.state.newMapping) {
                            dvm.state.step = dvm.state.ontologySelectStep;
                        } else {
                            dvm.state.step = dvm.state.editMappingStep;
                            var classes = dvm.mm.getAllClassMappings(dvm.mm.mapping.jsonld);
                            dvm.state.selectedClassMappingId = _.get(classes, "[0]['@id']");
                            dvm.state.updateAvailableProps();
                        }
                    }
                    dvm.setUploadValidity = function(bool) {
                        dvm.fileForm.$setValidity('fileUploaded', bool);
                    }
                    function testColumns() {
                        dvm.state.invalidProps = _.chain(dvm.mm.getAllDataMappings(dvm.mm.mapping.jsonld))
                            .map(dataMapping => _.pick(dataMapping, ['@id', prefixes.delim + 'columnIndex']))
                            .forEach(obj => _.set(obj, 'index', parseInt(obj['@id', prefixes.delim + 'columnIndex'][0]['@value'], 10)))
                            .filter(obj => obj.index > dvm.dm.filePreview.headers.length - 1)
                            .sortBy('index')
                            .value();
                    }
                    function onError(errorMessage) {
                        dvm.errorMessage = errorMessage;
                        dvm.dm.filePreview = undefined;
                        dvm.setUploadValidity(false);
                        dvm.state.invalidProps = [];
                    }
                },
                templateUrl: 'modules/mapper/directives/fileUploadOverlay/fileUploadOverlay.html'
            }
        }
})();
