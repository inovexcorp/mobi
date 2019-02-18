(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name rdfPreviewForm
         *
         * @description
         * The `rdfPreviewForm` module only provides the `rdfPreviewForm` directive which creates
         * a form for creating a preview of the loaded
         * {@link delimitedManager.service:delimitedManagerService#dataRows delimited data} with the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('rdfPreviewForm', [])
        /**
         * @ngdoc directive
         * @name rdfPreviewForm.directive:rdfPreviewForm
         * @scope
         * @restrict E
         * @requires delimitedManager.service:delimitedManagerService
         * @requires mappingManager.service:mappingManagerService
         *
         * @description
         * `rdfPreviewForm` is a directive that creates a form with controls to select an RDF
         * {@link mapperSerializationSelect.directive:mapperSerializationSelect serialization}
         * and a `code-mirror` to view a preview of the loaded
         * {@link delimitedManager.service:delimitedManagerService#dataRows delimited data} mapped by the
         * current {@link mapperState.service:mapperStateService#mapping mapping}. The directive is
         * replaced by the contents of its template.
         */
        .directive('rdfPreviewForm', rdfPreviewForm);

        rdfPreviewForm.$inject = ['delimitedManagerService', 'mapperStateService'];

        function rdfPreviewForm(delimitedManagerService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.dm = delimitedManagerService;
                    dvm.serializeFormat = angular.copy(dvm.dm.serializeFormat);
                    dvm.errorMessage = '';
                    dvm.editorOptions = {
                        readOnly: true,
                        indentUnit: 2,
                        lineWrapping: true
                    };

                    function setMode() {
                        if (dvm.serializeFormat === 'turtle') {
                            dvm.editorOptions.mode = 'text/turtle';
                        } else if (dvm.serializeFormat === 'jsonld') {
                            dvm.editorOptions.mode = 'application/ld+json';
                        } else if (dvm.serializeFormat === 'rdf/xml') {
                            dvm.editorOptions.mode = 'application/xml';
                        }
                    }

                    dvm.generatePreview = function() {
                        dvm.dm.previewMap(dvm.state.mapping.jsonld, dvm.serializeFormat).then(preview => {
                            setMode();
                            dvm.dm.preview = (dvm.serializeFormat === 'jsonld') ? JSON.stringify(preview) : _.toString(preview);
                            dvm.dm.serializeFormat = dvm.serializeFormat;
                        }, errorMessage => {
                            dvm.errorMessage = errorMessage;
                            dvm.dm.preview = '';
                        });
                    }

                    setMode();
                },
                templateUrl: 'mapper/directives/rdfPreviewForm/rdfPreviewForm.directive.html'
            }
        }
})();
