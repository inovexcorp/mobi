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
                controllerAs: 'dvm',
                controller: ['$scope', '$filter', 'REGEX', 'ontologyManagerService', function($scope, $filter, REGEX, ontologyManagerService) {
                    var vm = $scope.$parent.vm;
                    var dvm = this;
                    var prefix = vm.ontology['@id'] + '#';
                    var setAsObject = false;
                    var setAsDatatype = false;

                    dvm.iriPattern = REGEX.IRI;
                    dvm.createPropertyIri = prefix;
                    dvm.propertyTypes = vm.propertyTypes;
                    dvm.range = [];
                    dvm.domain = [];

                    dvm.nameChanged = function() {
                        if(!dvm.iriHasChanged) {
                            dvm.createPropertyIri = prefix + $filter('camelCase')(dvm.name, 'property');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.createPropertyIri = iriBegin + iriThen + iriEnd;
                    }

                    dvm.setRange = function() {
                        var isObjectProperty = ontologyManagerService.isObjectProperty(dvm.type);
                        if(isObjectProperty && !setAsObject) {
                            dvm.rangeList = vm.ontology.matonto.subClasses;
                            dvm.range = [];
                            setAsObject = true;
                            setAsDatatype = false;
                        } else if(!isObjectProperty && !setAsDatatype) {
                            dvm.rangeList = vm.ontology.matonto.dataPropertyRange;
                            dvm.range = [];
                            setAsObject = false;
                            setAsDatatype = true;
                        }
                    }
                }]
            }
        }
})();
