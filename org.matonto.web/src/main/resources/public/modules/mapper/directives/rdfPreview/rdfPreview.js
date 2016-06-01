(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name rdfPreview
         *
         * @description 
         * The `rdfPreview` module provides the `rdfPreview` directive, which creates
         * a container for generating a preview of delimited data mapped into RDF, and 
         * the `formatRdf` directive used for formatting the mapped data preview string.
         */
        .module('rdfPreview', ['csvManager', 'mappingManager'])
        /**
         * @ngdoc directive
         * @name rdfPreview.directive:rdfPreview
         * @scope
         * @restrict E
         *
         * @description 
         * `rdfPreview` is a directive which creates a div with controls to select an RDF
         * serialization and refresh a preview of mapped delimited data and an uneditable
         * textarea to display the mapped data preview. The div contains a tab to slide 
         * the preview area in and out. The serialization options are Turtle, JSON-LD, and
         * RDF/XML. The directive is replaced by the contents of its template.
         */
        .directive('rdfPreview', rdfPreview)
        /**
         * @ngdoc directive
         * @name rdfPreview.directive:formatRdf
         *
         * @description 
         * `formatRdf` is a directive which formats the passed in data into a string depending 
         * on the type of data passed in. If the data is passed as an object, it formats it 
         * into json. If the data isn't an object, it just passes the data back. The default 
         * value is an empty string.
         */
        .directive('formatRdf', formatRdf);

        formatRdf.$inject = ['$filter'];
        rdfPreview.$inject = ['$window', 'csvManagerService', 'mappingManagerService'];

        function formatRdf($filter) {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function(scope, element, attrs, modelCtrl) {
                    var formatJSON = function(data) {
                        var formatted = (typeof data === 'object') ? $filter('json')(data, 4) : (data || '');
                        return formatted;
                    }
                        
                    modelCtrl.$formatters.push(formatJSON);
                 }
               };
        }

        function rdfPreview($window, csvManagerService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.csv = csvManagerService;
                    dvm.manager = mappingManagerService;
                    dvm.visible = false;
                    dvm.preview = '';
                    dvm.options = [
                        {
                            name: 'JSON-LD',
                            value: 'jsonld'
                        },
                        {
                            name: 'Turtle',
                            value: 'turtle'
                        },
                        {
                            name: 'RDF/XML',
                            value: 'rdf/xml'
                        }
                    ];
                    dvm.generatePreview = function() {
                        dvm.csv.previewMap(dvm.manager.mapping.jsonld, dvm.serializeOption).then(preview => {
                            dvm.preview = preview;
                        }, errorMessage => {
                            console.log(errorMessage);
                        });
                    }
                },
                templateUrl: 'modules/mapper/directives/rdfPreview/rdfPreview.html'
            }
        }
})();
