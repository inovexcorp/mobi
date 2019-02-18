(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mappingPreview
         *
         * @description
         * The `mappingPreview` module only provides the `mappingPreview` directive which creates
         * a "boxed" area with a preview of a mapping.
         */
        .module('mappingPreview', [])
        /**
         * @ngdoc directive
         * @name mappingPreview.directive:mappingPreview
         * @scope
         * @restrict E
         * @requires prefixes.service:prefixes
         * @requires ontologyManager.service:ontologyManagerService
         * @requires mappingManager.service:mappingManagerService
         * @requires mapperState.service:mapperStateService
         *
         * @description
         * `mappingPreview` is a directive that creates a "boxed" div with a preview of a mapping with
         * its description, source ontology, and all its mapped classes and properties. The directive
         * is replaced by the contents of its template.
         */
        .directive('mappingPreview', mappingPreview);

        mappingPreview.$inject = ['prefixes', 'utilService', 'mappingManagerService', 'mapperStateService'];

        function mappingPreview(prefixes, utilService, mappingManagerService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.util = utilService;

                    dvm.getTitle = function(mappingEntity) {
                        return dvm.util.getDctermsValue(mappingEntity, 'title');
                    }
                    dvm.getIriTemplate = function(classMapping) {
                        var prefix = dvm.util.getPropertyValue(classMapping, prefixes.delim + 'hasPrefix');
                        var localName = dvm.util.getPropertyValue(classMapping, prefixes.delim + 'localName');
                        return prefix + localName;
                    }
                    dvm.getPropValue = function(propMapping) {
                        if (dvm.mm.isDataMapping(propMapping)) {
                            return dvm.util.getPropertyValue(propMapping, prefixes.delim + 'columnIndex')
                        } else {
                            var classMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.util.getPropertyId(propMapping, prefixes.delim + 'classMapping')});
                            return dvm.getTitle(classMapping);
                        }
                    }
                    dvm.isInvalid = function(propMappingId) {
                        return _.some(dvm.state.invalidProps, {'@id': propMappingId});
                    }
                },
                templateUrl: 'mapper/directives/mappingPreview/mappingPreview.directive.html'
            }
        }
})();
