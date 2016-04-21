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
                    var mappedColumns = mappingManagerService.getMappedColumns(dvm.mapping);
                    dvm.invalidColumns = _.sortBy(_.filter(mappedColumns, function(obj) {
                        return parseInt(obj.index, 10) > dvm.filePreview.headers.length - 1;
                    }), 'index');

                    dvm.getDataMappingName = function(dataMappingId) {
                        var propId = mappingManagerService.getPropIdByMappingId(dvm.mapping, dataMappingId);
                        var classId = mappingManagerService.getClassIdByMapping(
                            mappingManagerService.findClassWithDataMapping(dvm.mapping.jsonld, dataMappingId)
                        );
                        var propName = ontologyManagerService.getEntityName(ontologyManagerService.getClassProperty(dvm.ontology, classId, propId));
                        var className = ontologyManagerService.getEntityName(ontologyManagerService.getClass(dvm.ontology, classId));
                        return className + ": " + propName;
                    }
                    dvm.setValidity = function() {
                        if (dvm.validateForm) {
                            dvm.validateForm.$setValidity('validColumnMappings', dvm.invalidColumns.length === 0);
                        }
                    }
                },
                templateUrl: 'modules/mapper/directives/previousCheckOverlay/previousCheckOverlay.html'
            }
        }
})();
