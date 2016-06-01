(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name fileUploadOverlay
         * @requires  prefixes
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  csvManager
         *
         * @description 
         * The `fileUploadOverlay` module only provides the `fileUploadOverlay` directive which creates
         * an overlay with functionality to upload a delimited file to use for mapping.
         */
        .module('fileUploadOverlay', ['prefixes', 'csvManager', 'mapperState', 'mappingManager', 'ontologyManager'])
        /**
         * @ngdoc directive
         * @name fileUploadOverlay.directive:fileUploadOverlay
         * @scope
         * @restrict E
         * @requires  prefixes.service:prefixes
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  csvManager.service:csvManagerService
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

        fileUploadOverlay.$inject = ['prefixes', 'csvManagerService', 'mapperStateService', 'mappingManagerService', 'ontologyManagerService'];

        function fileUploadOverlay(prefixes, csvManagerService, mapperStateService, mappingManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                link: function(scope, el, attrs, ctrl) {
                    if (csvManagerService.fileObj) {
                        ctrl.setUploadValidity(true);
                    } else {
                        ctrl.setUploadValidity(false);
                    }
                },
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.csv = csvManagerService;
                    dvm.manager = mappingManagerService;
                    dvm.ontology = ontologyManagerService;
                    dvm.errorMessage = '';

                    dvm.isExcel = function() {
                        var fileName = _.get(dvm.csv.fileObj, 'name');
                        return _.includes(fileName, 'xls');
                    }
                    dvm.getDataMappingName = function(dataMappingId) {
                        var ontology = dvm.manager.getSourceOntology(dvm.manager.mapping.jsonld);
                        var propId = dvm.manager.getPropIdByMappingId(dvm.manager.mapping.jsonld, dataMappingId);
                        var classId = dvm.manager.getClassIdByMapping(
                            dvm.manager.findClassWithDataMapping(dvm.manager.mapping.jsonld, dataMappingId)
                        );
                        var propName = dvm.ontology.getEntityName(dvm.ontology.getClassProperty(ontology, classId, propId));
                        var className = dvm.ontology.getEntityName(dvm.ontology.getClass(ontology, classId));
                        return className + ': ' + propName;
                    }
                    dvm.upload = function() {
                        dvm.csv.upload(dvm.csv.fileObj).then(data => {
                            dvm.csv.fileName = data;
                            dvm.setUploadValidity(true);
                            return dvm.csv.previewFile(100);
                        }, onError).then(() => {
                            if (!dvm.state.newMapping) {
                                testColumns();
                            }
                        }, onError);
                    }
                    dvm.cancel = function() {
                        dvm.csv.reset();
                        if (dvm.state.newMapping) {
                            dvm.state.step = 0;
                            dvm.state.editMappingName = true;
                        } else {
                            dvm.state.initialize();
                        }
                    }
                    dvm.continue = function() {
                        if (dvm.state.newMapping) {
                            dvm.state.step = 2;                        
                        } else {
                            dvm.state.step = 4;
                            var classes = dvm.manager.getAllClassMappings(dvm.manager.mapping.jsonld);
                            dvm.state.selectedClassMappingId = _.get(classes, "[0]['@id']");
                            dvm.state.updateAvailableProps();
                        }
                    }
                    dvm.setUploadValidity = function(bool) {
                        dvm.fileForm.$setValidity('fileUploaded', bool);
                    }

                    function testColumns() {
                        dvm.state.invalidProps = _.chain(dvm.manager.getAllDataMappings(dvm.manager.mapping.jsonld))
                            .map(dataMapping => _.pick(dataMapping, ['@id', prefixes.delim + 'columnIndex']))
                            .forEach(obj => _.set(obj, 'index', parseInt(obj['@id', prefixes.delim + 'columnIndex'][0]['@value'], 10)))
                            .filter(obj => obj.index > dvm.csv.filePreview.headers.length - 1)
                            .sortBy('index')
                            .value();
                    }
                    function onError(errorMessage) {
                        dvm.errorMessage = errorMessage;
                        dvm.csv.filePreview = undefined;
                        dvm.setUploadValidity(false);
                        dvm.state.invalidProps = [];
                    }
                },
                templateUrl: 'modules/mapper/directives/fileUploadOverlay/fileUploadOverlay.html'
            }
        }
})();
