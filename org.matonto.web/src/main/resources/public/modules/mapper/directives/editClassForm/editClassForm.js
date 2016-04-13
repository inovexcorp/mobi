(function() {
    'use strict';

    angular
        .module('editClassForm', ['prefixes', 'mappingManager', 'ontologyManager'])
        .directive('editClassForm', editClassForm);

        editClassForm.$inject = ['prefixes', 'mappingManagerService', 'ontologyManagerService'];

        function editClassForm(prefixes, mappingManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    props: '=',
                    isLastClass: '=',
                    clickDelete: '&',
                    openProp: '&',
                    editIri: '&'
                },
                bindToController: {
                    mapping: '=',
                    classMappingId: '='
                },
                controller: ['$scope', function($scope) {
                    var dvm = this;

                    dvm.getIriTemplate = function() {
                        var classMapping = _.find(dvm.mapping.jsonld, {'@id': dvm.classMappingId});
                        var prefix = _.get(classMapping, "['" + prefixes.delim + "hasPrefix'][0]['@value']", '');
                        var localName = _.get(classMapping, "['" + prefixes.delim + "localName'][0]['@value']", '');
                        return prefix + localName;
                    }
                    dvm.openProperty = function(propId) {
                        $scope.openProp({propId: propId});
                    }
                    dvm.getTitle = function() {
                        var ontologyId = mappingManagerService.getSourceOntologyId(dvm.mapping);
                        var classId = mappingManagerService.getClassIdByMappingId(dvm.mapping, dvm.classMappingId);
                        return ontologyManagerService.getEntityName(ontologyManagerService.getClass(ontologyId, classId));
                    }
                }],
                templateUrl: 'modules/mapper/directives/editClassForm/editClassForm.html'
            }
        }
})();
