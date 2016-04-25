(function() {
    'use strict';

    angular
        .module('mappingPreview', ['mappingManager', 'ontologyManager'])
        .directive('mappingPreview', mappingPreview);

        mappingPreview.$inject = ['mappingManagerService', 'ontologyManagerService'];

        function mappingPreview(mappingManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    clickOntology: '&'
                },
                bindToController: {
                    mappingName: '='
                },
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.mapping = {};

                    $scope.$watch('mappingName', function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            getMapping();
                        }
                    });

                    dvm.getPrettyName = function(iri) {
                        return ontologyManagerService.getBeautifulIRI(iri);
                    }
                    dvm.getSourceOntologyId = function() {
                        return mappingManagerService.getSourceOntologyId(dvm.mapping);
                    }
                    dvm.getClassMappings = function() {
                        return mappingManagerService.getClassMappings(dvm.mapping);
                    }
                    dvm.getClassName = function(classMapping) {
                        return dvm.getPrettyName(mappingManagerService.getClassIdByMapping(classMapping));
                    }
                    dvm.getPropMappings = function(classMapping) {
                        return mappingManagerService.getPropMappingsByClass(dvm.mapping, classMapping['@id']);
                    }
                    dvm.getPropName = function(propMapping) {
                        return dvm.getPrettyName(mappingManagerService.getPropIdByMapping(propMapping));
                    }

                    function getMapping() {
                        mappingManagerService.getMapping(dvm.mappingName).then(function(response) {
                            dvm.mapping = response;
                            dvm.errorMessage = '';
                        }, function(error) {
                            dvm.errorMessage = error.statusText;
                        });
                    }

                    getMapping();
                }],
                templateUrl: 'modules/catalog/directives/mappingPreview/mappingPreview.html'
            }
        }
})();
