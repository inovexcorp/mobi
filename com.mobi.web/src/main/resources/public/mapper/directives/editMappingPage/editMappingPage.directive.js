(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name editMappingPage
         *
         * @description
         * The `editMappingPage` module only provides the `editMappingPage` directive which creates a Bootstrap `row`
         * with {@link block.directive:block blocks} for editing the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('editMappingPage', [])
        /**
         * @ngdoc directive
         * @name editMappingPage.directive:editMappingPage
         * @scope
         * @restrict E
         * @requires delimitedManager.service:delimitedManagerService
         * @requires mapperState.service:mapperStateService
         * @requires mappingManager.service:mappingManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `editMappingPage` is a directive that creates a Bootstrap `row` div with two columns containing
         * {@link block.directive:block blocks} for editing the current
         * {@link mapperState.service:mapperStateService#mapping mapping}. The left column contains either a block for
         * {@link editMappingForm.directive:editMappingForm editing} the mapping or a block for
         * {@link rdfPreviewForm.directive:rdfPreviewForm previewing} the mapped data using the current state of the
         * mapping. The right column contains a {@link previewDataGrid.directive:previewDataGrid preview} of the loaded
         * delimited data. From here, the user can choose to save the mapping and optionally run it against the loaded
         * delimited data. The directive houses the method for opening a modal to confirm canceling a mapping. The
         * directive is replaced by the contents of its template.
         */
        .directive('editMappingPage', editMappingPage);

        editMappingPage.$inject = ['$q', 'mapperStateService', 'mappingManagerService', 'delimitedManagerService', 'modalService'];

        function editMappingPage($q, mapperStateService, mappingManagerService, delimitedManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.dm = delimitedManagerService;
                    dvm.errorMessage = '';
                    dvm.tabs = {
                        edit: true,
                        preview: false
                    };

                    dvm.runMappingDownload = function() {
                        modalService.openModal('runMappingDownloadOverlay', {}, undefined, 'sm');
                    }
                    dvm.runMappingDataset = function() {
                        modalService.openModal('runMappingDatasetOverlay', {}, undefined, 'sm');
                    }
                    dvm.runMappingOntology = function() {
                        modalService.openModal('runMappingOntologyOverlay');
                    }
                    dvm.isSaveable = function() {
                        return dvm.state.invalidProps.length === 0 && !!dvm.mm.getAllClassMappings(dvm.state.mapping.jsonld).length;
                    }
                    dvm.save = function() {
                        if (dvm.state.isMappingChanged()) {
                            dvm.state.saveMapping().then(success, onError);
                        } else {
                            success();
                        }
                    }
                    dvm.cancel = function() {
                        if (dvm.state.isMappingChanged()) {
                            modalService.openConfirmModal('<p>Are you sure you want to cancel? Any current progress will be lost.</p>', dvm.reset);
                        } else {
                            success();
                        }
                    }
                    dvm.reset = function() {
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.dm.reset();
                    }

                    function onError(errorMessage) {
                        dvm.errorMessage = errorMessage
                    }
                    function success() {
                        dvm.errorMessage = '';
                        dvm.state.step = dvm.state.selectMappingStep;
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.dm.reset();
                    }
                },
                templateUrl: 'mapper/directives/editMappingPage/editMappingPage.directive.html'
            }
        }
})();
