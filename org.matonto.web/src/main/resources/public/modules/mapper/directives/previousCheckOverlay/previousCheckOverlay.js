(function() {
    'use strict';

    angular
        .module('previousCheckOverlay', ['ontologyManager', 'mappingManager'])
        .directive('previousCheckOverlay', previousCheckOverlay);

        previousCheckOverlay.$inject = ['ontologyManagerService', 'mappingManagerService'];

        function previousCheckOverlay(ontologyManagerService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    onClickBack: '&',
                    onClickContinue: '&'
                },
                bindToController: {
                    mapping: '=',
                    ontology: '=',
                    filePreview: '='
                },
                link: function(scope, elem, attrs, ctrl) {
                    ctrl.setValidity();
                },
                controller: function() {
                    var dvm = this;
                    dvm.invalidColumns = _.chain(mappingManagerService.getMappedColumns(dvm.mapping.jsonld))
                        .forEach(obj => obj.index = parseInt(obj.index, 10))
                        .filter(obj => obj.index > dvm.filePreview.headers.length - 1)
                        .sortBy('index')
                        .value();

                    dvm.getDataMappingName = function(dataMappingId) {
                        var propId = mappingManagerService.getPropIdByMappingId(dvm.mapping.jsonld, dataMappingId);
                        var classId = mappingManagerService.getClassIdByMapping(
                            mappingManagerService.findClassWithDataMapping(dvm.mapping.jsonld, dataMappingId)
                        );
                        var propName = ontologyManagerService.getEntityName(ontologyManagerService.getClassProperty(dvm.ontology, classId, propId));
                        var className = ontologyManagerService.getEntityName(ontologyManagerService.getClass(dvm.ontology, classId));
                        return className + ': ' + propName;
                    }
                    dvm.setValidity = function() {
                        if (dvm.validateForm) {
                            dvm.validateForm.$setValidity('validColumnMappings', dvm.invalidColumns.length === 0);
                            dvm.validateForm.$setValidity('existingOntology', dvm.ontology !== undefined);
                        }
                    }
                    dvm.getSourceOntologyId = function() {
                        return mappingManagerService.getSourceOntologyId(dvm.mapping);
                    }
                },
                templateUrl: 'modules/mapper/directives/previousCheckOverlay/previousCheckOverlay.html'
            }
        }
})();
