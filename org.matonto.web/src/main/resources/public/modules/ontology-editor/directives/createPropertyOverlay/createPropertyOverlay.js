(function() {
    'use strict';

    angular
        .module('createPropertyOverlay', ['camelCase', 'ontologyManager'])
        .directive('createPropertyOverlay', createPropertyOverlay);

        function createPropertyOverlay() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createPropertyOverlay/createPropertyOverlay.html',
                scope: {
                    onCreate: '&',
                    onCancel: '&',
                    createPropertyError: '=',
                    showIriOverlay: '=',
                    ontologyId: '@',
                    matonto: '='
                },
                bindToController: {
                    iriBegin: '=',
                    iriThen: '=',
                    propertyTypes: '=',
                    subClasses: '=',
                    propertyRange: '='
                },
                controllerAs: 'dvm',
                controller: ['$filter', 'REGEX', 'ontologyManagerService', function($filter, REGEX, ontologyManagerService) {
                    var dvm = this;
                    var prefix = dvm.iriBegin + dvm.iriThen;
                    var setAsObject = false;
                    var setAsDatatype = false;

                    dvm.iriPattern = REGEX.IRI;
                    dvm.iri = prefix;
                    dvm.range = [];
                    dvm.domain = [];

                    dvm.nameChanged = function() {
                        if(!dvm.iriHasChanged) {
                            dvm.iri = prefix + $filter('camelCase')(dvm.name, 'property');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.iri = iriBegin + iriThen + iriEnd;
                    }

                    dvm.setRange = function() {
                        var isObjectProperty = ontologyManagerService.isObjectProperty(dvm.type);
                        if(isObjectProperty && !setAsObject) {
                            dvm.rangeList = dvm.subClasses;
                            dvm.range = [];
                            setAsObject = true;
                            setAsDatatype = false;
                        } else if(!isObjectProperty && !setAsDatatype) {
                            dvm.rangeList = dvm.propertyRange;
                            dvm.range = [];
                            setAsObject = false;
                            setAsDatatype = true;
                        }
                    }
                }]
            }
        }
})();
