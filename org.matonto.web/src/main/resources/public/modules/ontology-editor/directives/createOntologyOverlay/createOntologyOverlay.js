(function() {
    'use strict';

    angular
        .module('createOntologyOverlay', ['camelCase'])
        .directive('createOntologyOverlay', createOntologyOverlay);

        function createOntologyOverlay() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createOntologyOverlay/createOntologyOverlay.html',
                scope: {
                    onCreate: '&',
                    onCancel: '&',
                    createOntologyError: '='
                },
                controllerAs: 'dvm',
                controller: ['$filter', 'REGEX', function($filter, REGEX) {
                    var dvm = this;
                    var date = new Date();
                    var prefix = 'https://matonto.org/ontologies/' + (date.getMonth() + 1) + '/' + date.getFullYear() + '/';

                    dvm.iriPattern = REGEX.IRI;
                    dvm.iriHasChanged = false;
                    dvm.iri = prefix;

                    dvm.nameChanged = function() {
                        if(!dvm.iriHasChanged) {
                            dvm.iri = prefix + $filter('camelCase')(dvm.name, 'class');
                        }
                    }
                }]
            }
        }
})();
