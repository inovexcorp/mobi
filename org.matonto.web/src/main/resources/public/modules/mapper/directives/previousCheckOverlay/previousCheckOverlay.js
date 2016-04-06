(function() {
    'use strict';

    angular
        .module('previousCheckOverlay', ['mappingManager'])
        .directive('previousCheckOverlay', previousCheckOverlay);

        previousCheckOverlay.$inject = ['prefixes', 'ontologyManagerService', 'mappingManagerService'];

        function previousCheckOverlay(prefixes, ontologyManagerService, mappingManagerService) {
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
                    filePreview: '='
                },
                link: function(scope, elem, attrs, ctrl) {
                    if (scope.validateForm) {
                        scope.validateForm.$setValidity('validColumnMappings', ctrl.invalidColumns.length === 0);
                    }
                },
                controller: function() {
                    var dvm = this;
                    var mappedColumns = mappingManagerService.getMappedColumns(dvm.mapping);
                    dvm.invalidColumns = _.sortBy(_.filter(mappedColumns, function(obj) {
                        return obj.index > dvm.filePreview.headers.length - 1;
                    }), 'index');

                    dvm.getDataMappingName = function(dataMappingId) {
                        var propId = mappingManagerService.getPropIdByMappingId(dvm.mapping, dataMappingId);
                        var classId = mappingManagerService.getClassIdByMapping(
                            mappingManagerService.findClassWithDataMapping(dvm.mapping.jsonld, dataMappingId)
                        );
                        var propName = ontologyManagerService.getEntityName(
                            ontologyManagerService.getClassProperty(mappingManagerService.getSourceOntologyId(dvm.mapping), classId, propId)
                        );
                        var className = ontologyManagerService.getEntityName(
                            ontologyManagerService.getClass(mappingManagerService.getSourceOntologyId(dvm.mapping), classId)
                        );
                        return className + ": " + propName;
                    }
                },
                templateUrl: 'modules/mapper/directives/previousCheckOverlay/previousCheckOverlay.html'
            }
        }
})();
