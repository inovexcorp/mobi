(function() {
    'use strict';

    angular
        .module('createClassOverlay', ['camelCase'])
        .directive('createClassOverlay', createClassOverlay);

        function createClassOverlay() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createClassOverlay/createClassOverlay.html',
                scope: {
                    onCreate: '&',
                    onCancel: '&',
                    createClassError: '=',
                    showIriOverlay: '='
                },
                bindToController: {
                    iriBegin: '=',
                    iriThen: '='
                },
                controllerAs: 'dvm',
                controller: ['$filter', 'REGEX', function($filter, REGEX) {
                    var dvm = this;
                    var prefix = dvm.iriBegin + dvm.iriThen;

                    dvm.iriPattern = REGEX.IRI;
                    dvm.iri = prefix;

                    dvm.nameChanged = function() {
                        if(!dvm.iriHasChanged) {
                            dvm.iri = prefix + $filter('camelCase')(dvm.name, 'class');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.iri = iriBegin + iriThen + iriEnd;
                    }
                }]
            }
        }
})();
