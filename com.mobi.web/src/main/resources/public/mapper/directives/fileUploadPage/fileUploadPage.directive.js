(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name fileUploadPage
         *
         * @description
         * The `fileUploadPage` module only provides the `fileUploadPage` directive which creates a Bootstrap `row` with
         * {@link block.directive:block blocks} for uploading and
         * {@link previewDataGrid.directive:previewDataGrid previewing} delimited data.
         */
        .module('fileUploadPage', [])
        /**
         * @ngdoc directive
         * @name fileUploadPage.directive:fileUploadPage
         * @scope
         * @restrict E
         * @requires delimitedManager.service:delimitedManagerService
         * @requires mapperState.service:mapperStateService
         * @requires mappingManager.service:mappingManagerService
         * @requires util.service:utilService
         * @requires modal.service:modalService
         *
         * @description
         * `fileUploadPage` is a directive that creates a Bootstrap `row` div with two columns containing
         * {@link block.directive:block blocks} for uploading and previewing delimited data. The left column contains a
         * block with a {@link fileUploadForm.directive:fileUploadForm file upload form} and buttons to cancel the
         * current workflow or continue. If there are invalid property mapping in the current mapping, you can only
         * continue if editing a mapping. The right column contains a
         * {@link previewDataGrid.directive:previewDataGrid preview} of the loaded delimited data. The directive is
         * replaced by the contents of its template.
         */
        .directive('fileUploadPage', fileUploadPage);

        fileUploadPage.$inject = ['mapperStateService', 'mappingManagerService', 'delimitedManagerService', 'utilService', 'modalService'];

        function fileUploadPage(mapperStateService, mappingManagerService, delimitedManagerService, utilService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'mapper/directives/fileUploadPage/fileUploadPage.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.dm = delimitedManagerService;
                    dvm.util = utilService;

                    dvm.runMappingDownload = function() {
                        modalService.openModal('runMappingDownloadOverlay', {}, undefined, 'sm');
                    }
                    dvm.runMappingDataset = function() {
                        modalService.openModal('runMappingDatasetOverlay', {}, undefined, 'sm');
                    }
                    dvm.runMappingOntology = function() {
                        modalService.openModal('runMappingOntologyOverlay');
                    }
                    dvm.getDataMappingName = function(dataMappingId) {
                        var propMapping = _.find(dvm.state.mapping.jsonld, {'@id': dataMappingId});
                        var classMapping = dvm.mm.findClassWithDataMapping(dvm.state.mapping.jsonld, dataMappingId)
                        return dvm.mm.getPropMappingTitle(dvm.util.getDctermsValue(classMapping, 'title'), dvm.util.getDctermsValue(propMapping, 'title'));
                    }
                    dvm.cancel = function() {
                    	dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.dm.reset();
                    }
                    dvm.edit = function() {
                        var classMappings = dvm.mm.getAllClassMappings(dvm.state.mapping.jsonld);
                        dvm.state.selectedClassMappingId = _.get(_.head(classMappings), '@id', '');
                        _.forEach(_.uniq(_.map(classMappings, dvm.mm.getClassIdByMapping)), dvm.state.setProps);
                        dvm.state.step = dvm.state.editMappingStep;
                        if (dvm.state.newMapping) {
                            modalService.openModal('mappingConfigOverlay', {}, undefined, 'lg');
                        }
                    }
                }
            }
        }
})();
