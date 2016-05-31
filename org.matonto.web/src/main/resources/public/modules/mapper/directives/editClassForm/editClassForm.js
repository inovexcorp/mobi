(function() {
    'use strict';

    angular
        .module('editClassForm', ['prefixes', 'mapperState', 'mappingManager', 'ontologyManager'])
        .directive('editClassForm', editClassForm);

        editClassForm.$inject = ['prefixes', 'mapperStateService', 'mappingManagerService', 'ontologyManagerService'];

        function editClassForm(prefixes, mapperStateService, mappingManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.manager = mappingManagerService;
                    dvm.state = mapperStateService;
                    dvm.ontology = ontologyManagerService;

                    dvm.getIriTemplate = function() {
                        var classMapping = _.find(dvm.manager.mapping.jsonld, {'@id': dvm.state.selectedClassMappingId});
                        var prefix = _.get(classMapping, "['" + prefixes.delim + "hasPrefix'][0]['@value']", '');
                        var localName = _.get(classMapping, "['" + prefixes.delim + "localName'][0]['@value']", '');
                        return prefix + localName;
                    }
                    dvm.getTitle = function() {
                        var classId = dvm.manager.getClassIdByMappingId(dvm.manager.mapping.jsonld, dvm.state.selectedClassMappingId);
                        var ontology = dvm.ontology.findOntologyWithClass(dvm.manager.sourceOntologies, classId);
                        return dvm.ontology.getEntityName(dvm.ontology.getClass(ontology, classId));
                    }
                },
                templateUrl: 'modules/mapper/directives/editClassForm/editClassForm.html'
            }
        }
})();
