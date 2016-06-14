(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name classPreview
         * @requires  ontologyManager
         *
         * @description 
         * The `classPreview` module only provides the `classPreview` directive which creates
         * a brief description of the passed class and its properties.
         */
        .module('classPreview', ['ontologyManager'])
        /**
         * @ngdoc directive
         * @name classPreview.directive:classPreview
         * @scope
         * @restrict E
         * @requires  ontologyManager.service:ontologyManagerService
         *
         * @description 
         * `classPreview` is a directive that creates a div with a brief description of the passed 
         * class and its properties. It displays the name of the class and the list of its properties.
         * The directive is replaced by the contents of its template.
         *
         * @param {object} classObj the class object from an ontology to preview
         */
        .directive('classPreview', classPreview);

        classPreview.$inject = ['ontologyManagerService'];

        function classPreview(ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    classObj: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;

                    dvm.createTitle = function() {
                        return dvm.om.getEntityName(dvm.classObj);
                    }
                    dvm.createPropList = function() {
                        return _.map(_.get(dvm.classObj, 'matonto.properties'), prop => dvm.om.getEntityName(prop));
                    }
                },
                templateUrl: 'modules/mapper/directives/classPreview/classPreview.html'
            }
        }
})();
