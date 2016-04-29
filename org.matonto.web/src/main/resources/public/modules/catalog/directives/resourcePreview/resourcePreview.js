(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name resourcePreview
         * @requires catalogManager
         *
         * @description 
         * The `resourcePreview` module only provides the `resourcePreview` directive
         * which creates a preview of information about a particular resource object.
         */
        .module('resourcePreview', ['catalogManager'])
        /**
         * @ngdoc directive
         * @name resourcePreview.directive:resourcePreview
         * @scope
         * @restrict E
         * @requires catalogManager.catalogManagerService
         *
         * @description 
         * `resourcePreview` is a directive that creates a preview of information about
         * a particular resource object. the directive is replaced byt he content of the 
         * template. If no resource is passed, a static message is shown.
         *
         * @param {Object=undefined} resource The resource object to be shown
         * @param {string} resource.title The title of the resource object
         * @param {Object} resource.issued An object containing information about the 
         * date the resource was created.
         * @param {Object} resource.modified An object containing information about the 
         * date the resource was last modified.
         * @param {string} resource.description A desctiption of the resource object
         * @param {string} resource.type A the resource type IRI for the resource object
         * @param {string[]=undefined} resource.keywords An array of keywords for the resource.
         *
         * @usage
         * <!-- Without a resource -->
         * <resource-preview resource="undefined"></resource-preview>
         *
         * <!-- With a resource -->
         * <resource-preview resource="{title: 'Resource', description: '', type: 'https://matonto.org/ontologies/catalog#Ontology', issued: {year: 2000, month: 1, day: 1}, modified: {year: 2000, month: 1, day: 1}}"></resource-preview>
         */
        .directive('resourcePreview', resourcePreview);

        resourcePreview.$inject = ['catalogManagerService'];

        function resourcePreview(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    resource: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.getDate = function(date) {
                        var jsDate = catalogManagerService.getDate(date);
                        return jsDate.toDateString();
                    }
                },
                templateUrl: 'modules/catalog/directives/resourcePreview/resourcePreview.html'
            }
        }
})();
