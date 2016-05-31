(function() {
    'use strict';

    angular
        .module('rdfPreview', ['csvManager', 'mappingManager'])
        .directive('rdfPreview', rdfPreview)
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
