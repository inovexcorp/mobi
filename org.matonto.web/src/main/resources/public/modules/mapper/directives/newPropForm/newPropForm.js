(function() {
    'use strict';

    angular
        .module('newPropForm', ['ontologyManager', 'mappingManager', 'mapperState', 'csvManager'])
        .directive('newPropForm', newPropForm);

        newPropForm.$inject = ['ontologyManagerService', 'mappingManagerService', 'mapperStateService', 'csvManagerService'];

        function newPropForm(ontologyManagerService, mappingManagerService, mapperStateService, csvManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.manager = mappingManagerService;
                    dvm.ontology = ontologyManagerService;
                    dvm.csv = csvManagerService;

                    dvm.update = function() {
                        if (!dvm.isObjectProperty()) {
                            dvm.state.updateAvailableColumns();
                        }
                    }
                    dvm.isObjectProperty = function() {
                        return dvm.ontology.isObjectProperty(_.get(dvm.state.selectedProp, '@type', []));
                    }
                    dvm.getClassName = function() {
                        var classId = dvm.manager.getClassIdByMappingId(dvm.manager.mapping.jsonld, dvm.state.selectedClassMappingId);
                        var ontology = dvm.ontology.findOntologyWithClass(dvm.manager.sourceOntologies, classId);
                        return dvm.ontology.getEntityName(dvm.ontology.getClass(ontology, classId));
                    }
                    dvm.set = function() {
                        if (dvm.isObjectProperty()) {
                            dvm.manager.mapping.jsonld = dvm.manager.addObjectProp(dvm.manager.mapping.jsonld, dvm.manager.sourceOntologies, 
                                dvm.state.selectedClassMappingId, dvm.state.selectedProp['@id']);
                        } else {
                            var columnIdx = dvm.csv.filePreview.headers.indexOf(dvm.state.selectedColumn);
                            var propId = dvm.state.selectedProp['@id'];
                            var classId = dvm.manager.getClassIdByMappingId(dvm.manager.mapping.jsonld, dvm.state.selectedClassMappingId)
                            var ontology = dvm.ontology.findOntologyWithClass(dvm.manager.sourceOntologies, classId);
                            dvm.manager.mapping.jsonld = dvm.manager.addDataProp(dvm.manager.mapping.jsonld, ontology, dvm.state.selectedClassMappingId, propId, columnIdx);
                        }
                        
                        dvm.state.resetEdit();
                        dvm.state.changedMapping();
                    }
                    dvm.setNext = function() {
                        var classMappingId = dvm.state.selectedClassMappingId;
                        dvm.set();
                        dvm.state.newProp = true;
                        dvm.state.selectedClassMappingId = classMappingId;
                        dvm.state.updateAvailableProps();
                    }
                },
                templateUrl: 'modules/mapper/directives/newPropForm/newPropForm.html'
            }
        }
})();
