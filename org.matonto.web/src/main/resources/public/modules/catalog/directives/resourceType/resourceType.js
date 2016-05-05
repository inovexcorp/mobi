(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name resourceType
         * @requires catalogManager
         *
         * @description 
         * The `resourceType` module only provides the `resourceType` directive which
         * creates a span with the Bootstrap 'label' class with different colors for 
         * different resource type IRIs.
         */
        .module('resourceType', ['catalogManager'])
        /**
         * @ngdoc directive
         * @name resourceType.directive:resourceType
         * @scope
         * @restrict E
         * @requires catalogManager.catalogManagerService
         *
         * @description 
         * `resourceType` is a directive that creates a span with the Bootstrap 'label'
         * class with different background colors for different resource type IRIs. The
         * directive is replaced with the content of the template.
         *
         * @param {Object} resource A resource object
         * @param {string} resource.type The resource type IRI for the resource object
         *
         * @usage
         * <resource-type resource="{type: 'https://matonto.org/ontologies/catalog#Ontology'}"></resource-type>
         */
        .directive('resourceType', resourceType);

        resourceType.$inject = ['catalogManagerService'];

        function resourceType(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    type: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.getType = function(type) {
                        return catalogManagerService.getType(type);
                    }
                },
                templateUrl: 'modules/catalog/directives/resourceType/resourceType.html'
            }
        }
})();
