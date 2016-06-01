(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name ontologyPreviewOverlay
         * @requires prefixes
         * @requires ontologyManager
         *
         * @description 
         * The `ontologyPreviewOverlay` module only provides the `ontologyPreviewOverlay` directive 
         * which creates an overlay containing an {@link ontologyPreview.directive:ontologyPreview ontologyPreview}
         * of the passed ontology.
         */
        .module('ontologyPreviewOverlayOverlay', ['ontologyManager', 'mapperState'])
        /**
         * @ngdoc directive
         * @name ontologyPreviewOverlay.directive:ontologyPreviewOverlay
         * @scope
         * @restrict E
         * @requires  prefixes.service:prefixes
         * @requires  ontologyManager.service:ontologyManagerService
         *
         * @description 
         * `ontologyPreviewOverlay` is a directive which creates an overlay containing a 
         * {@link ontologyPreview.directive:ontologyPreview} of the passed ontology object.
         * The directive is replaced by the contents of its template.
         *
         * @param {object} ontology an ontology object from the {@link ontologyManager.service:ontologyManagerService ontologyManagerService}
         */
        .directive('ontologyPreviewOverlayOverlay', ontologyPreviewOverlayOverlay);

        ontologyPreviewOverlayOverlay.$inject = ['ontologyManagerService', 'mapperStateService'];

        function ontologyPreviewOverlayOverlay(ontologyManagerService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    ontology: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.ontology = ontologyManagerService;
                    dvm.state = mapperStateService;
                },
                templateUrl: 'modules/mapper/directives/ontologyPreviewOverlayOverlay/ontologyPreviewOverlayOverlay.html'
            }
        }
})();
