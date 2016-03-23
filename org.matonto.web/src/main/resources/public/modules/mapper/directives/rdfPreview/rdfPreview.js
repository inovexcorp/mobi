(function() {
    'use strict';

    angular
        .module('rdfPreview', [])
        .directive('rdfPreview', rdfPreview)
        .directive('formatRdf', formatRdf);

        function formatRdf($filter) {
            return {
                require: 'ngModel',
                link: function(scope, element, attrs, modelCtrl) {
                    var formatJSON = function(preview) {
                        if (!preview) { 
                            preview = '';
                        }
                        var formatted = (typeof preview === 'object') ? $filter('json')(preview) : preview;
                        return formatted;
                    }
                        
                    modelCtrl.$formatters.push(formatJSON);
                 }
               };
        }

        function rdfPreview($window) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    preview: '=',
                    createPreview: '&'
                },
                link: function(scope, elem, attrs, ctrl) {
                    var textarea = elem[0].querySelector("#text-preview");
                    ctrl.textareaHeight = elem[0].offsetHeight - textarea.offsetTop - 10;

                    angular.element($window).bind('resize', function() {
                        var textarea = elem[0].querySelector("#text-preview");
                        ctrl.textareaHeight = elem[0].offsetHeight - textarea.offsetTop - 10;

                        scope.$digest();
                    });
                },
                controller: function() {
                    var dvm = this;
                    dvm.visible = true;
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
                            value: 'rdfxml'
                        }
                    ];
                },
                templateUrl: 'modules/mapper/directives/rdfPreview/rdfPreview.html'
            }
        }
})();
