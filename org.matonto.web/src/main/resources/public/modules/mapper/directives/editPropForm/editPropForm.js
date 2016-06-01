(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name editPropForm
         * @requires  prefixes
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  csvManager
         *
         * @description 
         * The `editPropForm` module only provides the `editPropForm` directive which creates
         * a form with functionality to change the column for a datatype property mapping or simply 
         * preview an object property mapping.
         */
        .module('editPropForm', ['prefixes', 'ontologyManager', 'mappingManager', 'mapperState', 'csvManager'])
        /**
         * @ngdoc directive
         * @name editPropForm.directive:editPropForm
         * @scope
         * @restrict E
         * @requires  prefixes.service:prefixes
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  csvManager.service:csvManagerService
         *
         * @description 
         * `editPropForm` is a directive that creates a form with functionality to change the column for 
         * a datatype property mapping or simply preview an object property mapping. If the selected property
         * mapping is a data mapping, a column select is rendered with a "Set" button. If the selected property
         * is an object mapping, a range class description is rendered. The directive is replaced by the 
         * contents of its template.
         */
        .directive('editPropForm', editPropForm);

        editPropForm.$inject = ['prefixes', 'ontologyManagerService', 'mappingManagerService', 'mapperStateService', 'csvManagerService'];

        function editPropForm(prefixes, ontologyManagerService, mappingManagerService, mapperStateService, csvManagerService) {
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
                    dvm.csv = csvManagerService;

                    dvm.set = function() {
                        var columnIdx = dvm.csv.filePreview.headers.indexOf(dvm.state.selectedColumn);
                        var propId = dvm.getPropId();
                        var ontology = dvm.ontology.findOntologyWithClass(dvm.manager.sourceOntologies, dvm.getClassId());
                        dvm.manager.mapping.jsonld = dvm.manager.addDataProp(dvm.manager.mapping.jsonld, ontology, dvm.state.selectedClassMappingId, propId, columnIdx);
                        var propMappingId = _.get(dvm.manager.getDataMappingFromClass(dvm.manager.mapping.jsonld, dvm.state.selectedClassMappingId, propId), '@id');
                        _.remove(dvm.invalidProps, {'@id': propMappingId});
                        dvm.state.resetEdit();
                        dvm.state.changedMapping();
                    }
                    dvm.getClassId = function() {
                        return dvm.manager.getClassIdByMappingId(dvm.manager.mapping.jsonld, dvm.state.selectedClassMappingId);
                    }
                    dvm.getPropId = function() {
                        return dvm.manager.getPropIdByMappingId(dvm.manager.mapping.jsonld, dvm.state.selectedPropMappingId);
                    }
                    dvm.getTitle = function() {
                        var classId = dvm.getClassId();
                        var ontology = dvm.ontology.findOntologyWithClass(dvm.manager.sourceOntologies, classId);
                        var className = dvm.ontology.getEntityName(dvm.ontology.getClass(ontology, classId));
                        var propName = dvm.ontology.getEntityName(getClassProp(classId, dvm.getPropId()));
                        return className + ': ' + propName;
                    }
                    dvm.isObjectProperty = function() {
                        return dvm.ontology.isObjectProperty(_.get(getClassProp(dvm.getClassId(), dvm.getPropId()), '@type', []));
                    }
                    function getClassProp(classId, propId) {
                        var ontology = dvm.ontology.findOntologyWithClass(dvm.manager.sourceOntologies, classId);
                        return dvm.ontology.getClassProperty(ontology, classId, propId);
                    }
                },
                templateUrl: 'modules/mapper/directives/editPropForm/editPropForm.html'
            }
        }
})();
