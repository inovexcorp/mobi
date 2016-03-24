(function() {
    'use strict';

    angular
        .module('classPreview', ['ontologyManager'])
        .directive('classPreview', classPreview);

        classPreview.$inject = ['ontologyManagerService'];

        function classPreview(ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    classObj: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.createTitle = function() {
                        return ontologyManagerService.getEntityName(dvm.classObj);
                    }
                    dvm.createPropList = function() {
                        return _.map(_.get(dvm.classObj, 'matonto.properties'), function(prop) {
                            return ontologyManagerService.getEntityName(prop);
                        });
                    }
                },
                templateUrl: 'modules/mapper/directives/classPreview/classPreview.html'
            }
        }
})();
