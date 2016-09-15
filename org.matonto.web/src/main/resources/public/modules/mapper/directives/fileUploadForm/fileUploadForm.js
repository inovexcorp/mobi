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
        .module('fileUploadForm', [])
        .directive('fileUploadForm', fileUploadForm);

        fileUploadForm.$inject = ['$q', 'prefixes', 'delimitedManagerService', 'mapperStateService', 'mappingManagerService', 'ontologyManagerService'];

        function fileUploadForm($q, prefixes, delimitedManagerService, mapperStateService, mappingManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.dm = delimitedManagerService;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.errorMessage = '';
                    dvm.fileObj = undefined;

                    dvm.isExcel = function() {
                        var fileName = _.get(dvm.fileObj, 'name', '');
                        return _.includes(fileName, 'xls');
                    }
                    dvm.getDataMappingName = function(dataMappingId) {
                        var propId = dvm.mm.getPropIdByMappingId(dvm.mm.mapping.jsonld, dataMappingId);
                        var classId = dvm.mm.getClassIdByMapping(dvm.mm.findClassWithDataMapping(dvm.mm.mapping.jsonld, dataMappingId));
                        var propOntology = dvm.mm.findSourceOntologyWithProp(propId);
                        var classOntology = dvm.mm.findSourceOntologyWithClass(classId);
                        var propName = dvm.om.getEntityName(dvm.om.getEntity(propOntology.entities, propId));
                        var className = dvm.om.getEntityName(dvm.om.getEntity(classOntology.entities, classId));
                        return dvm.mm.getPropMappingTitle(className, propName);
                    }
                    dvm.upload = function() {
                        if (dvm.fileObj) {
                            dvm.dm.upload(dvm.fileObj).then(data => {
                                dvm.dm.fileName = data;
                                dvm.errorMessage = '';
                                return dvm.dm.previewFile(50);
                            }, errorMessage => $q.reject(errorMessage)).then(() => {
                                if (!dvm.state.newMapping) {
                                    testColumns();
                                }
                            }, onError);
                        }
                    }
                    dvm.updateContainsHeaders = function() {
                        if (dvm.dm.filePreview) {
                            if (dvm.dm.containsHeaders) {
                                dvm.dm.filePreview.headers = dvm.dm.filePreview.rows[0];
                            } else {
                                dvm.dm.filePreview.headers = [];
                                _.times(dvm.dm.filePreview.rows[0].length, index => {
                                    dvm.dm.filePreview.headers.push('Column ' + (index + 1));
                                });
                            }
                        }
                    }
                    $scope.$watch('dvm.dm.separator', (newValue, oldValue) => {
                        if (newValue !== oldValue && !dvm.isExcel()) {
                            dvm.dm.previewFile(50).then(() => {
                                if (!dvm.state.newMapping) {
                                    testColumns();
                                }
                            }, onError);
                        }
                    });

                    function testColumns() {
                        dvm.state.invalidProps = _.chain(dvm.mm.getAllDataMappings(dvm.mm.mapping.jsonld))
                            .map(dataMapping => _.pick(dataMapping, ['@id', prefixes.delim + 'columnIndex']))
                            .forEach(obj => _.set(obj, 'index', parseInt(obj['@id', prefixes.delim + 'columnIndex'][0]['@value'], 10)))
                            .filter(obj => obj.index > dvm.dm.dataRows[0].length - 1)
                            .sortBy('index')
                            .value();
                    }
                    function onError(errorMessage) {
                        dvm.errorMessage = errorMessage;
                        dvm.dm.dataRows = undefined;
                        dvm.state.invalidProps = [];
                    }
                }],
                templateUrl: 'modules/mapper/directives/fileUploadForm/fileUploadForm.html'
            }
        }
})();