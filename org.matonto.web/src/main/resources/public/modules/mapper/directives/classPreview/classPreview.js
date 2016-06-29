(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name classPreview
         * @requires ontologyManager
         * @requires prefixes
         *
         * @description 
         * The `classPreview` module only provides the `classPreview` directive which creates
         * a brief description of the passed class and its properties.
         */
        .module('classPreview', ['prefixes', 'ontologyManager'])
        /**
         * @ngdoc directive
         * @name classPreview.directive:classPreview
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires prefixes.service:prefixes
         *
         * @description 
         * `classPreview` is a directive that creates a div with a brief description of the passed 
         * class and its properties. It displays the name of the class and the list of its properties.
         * The directive is replaced by the contents of its template.
         *
         * @param {object} classObj the class object from an ontology to preview
         */
        .directive('classPreview', classPreview);

        classPreview.$inject = ['prefixes', 'ontologyManagerService'];

        function classPreview(prefixes, ontologyManagerService) {
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
                    dvm.numPropPreview = 5;
                    dvm.full = false;

                    dvm.createTitle = function() {
                        return dvm.om.getEntityName(dvm.classObj);
                    }
                    dvm.createPropList = function() {
                        return _.map(_.get(dvm.classObj, 'matonto.properties'), prop => dvm.om.getEntityName(prop));
                    }
                    dvm.createDescription = function() {
                        return _.get(dvm.classObj, "['" + prefixes.rdfs + "comment'][0]['@value']", _.get(dvm.classObj, "['" + prefixes.dc + "description'][0]['@value']", ''));
                    }
                    dvm.getProps = function() {
                        return _.get(dvm.classObj, 'matonto.properties', []);
                    }
                    dvm.getPropList = function() {
                        var props = dvm.getProps();
                        if (!dvm.full) {
                            props = _.take(props, dvm.numPropPreview);
                        }
                        return _.map(props, prop => dvm.om.getEntityName(prop));
                    }
                },
                templateUrl: 'modules/mapper/directives/classPreview/classPreview.html'
            }
        }
})();
