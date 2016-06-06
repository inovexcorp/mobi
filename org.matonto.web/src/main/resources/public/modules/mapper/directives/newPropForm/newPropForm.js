(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name newPropForm
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  csvManager
         *
         * @description 
         * The `newPropForm` module only provides the `newPropForm` directive which creates
         * a form to add a new property mapping to the selected mapping.
         */
        .module('newPropForm', ['ontologyManager', 'mappingManager', 'mapperState', 'csvManager'])
        /**
         * @ngdoc directive
         * @name newPropForm.directive:newPropForm
         * @scope
         * @restrict E
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  csvManager.service:csvManagerService
         *
         * @description 
         * `newPropForm` is a directive that creates a form with functionality to add a new 
         * property mapping to the selected mapping. It creates a {@link propSelect.directive:propSelect}
         * with all the unmapped properties for a class. If the selected property is an object 
         * property, it renders a description of the class it links to. If the selected property
         * is a data property, it renders a {@link columnSelect.directive:columnSelect columnSelect} to pick
         * the column the property maps to. There are buttons to set the property and optionally
         * continue to add properties for the same class. The directive is replaced by the 
         * contents of its template.
         */
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
                        
                        dvm.state.openedClasses = _.union(dvm.state.openedClasses, [dvm.state.selectedClassMappingId]);
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
