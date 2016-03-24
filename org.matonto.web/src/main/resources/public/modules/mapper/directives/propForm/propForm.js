(function() {
    'use strict';

    angular
        .module('propForm', ['prefixes', 'ontologyManager'])
        .directive('propForm', propForm);

        propForm.$inject = ['$timeout', 'prefixes', 'ontologyManagerService'];

        function propForm($timeout, prefixes, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    ontologyId: '@',
                    classId: '=',
                    set: '&',
                    setNext: '&'
                },
                bindToController: {
                    props: '=',
                    selectedProp: '=ngModel',
                    isDatatypeProp: '&',
                    isObjectProp: '&'
                },
                controller: function() {
                    var dvm = this;

                    dvm.update = function() {
                        $timeout(function() {
                            if (dvm.selectedProp) {
                                if (dvm.isObjectProperty()) {
                                    dvm.isObjectProp();
                                } else {
                                    dvm.isDatatypeProp();
                                }
                            }
                        });
                    }
                    dvm.isObjectProperty = function() {
                        return ontologyManagerService.isObjectProperty(
                            _.get(_.find(dvm.props, {'@id': dvm.selectedProp}), '@type', []), 
                            prefixes.owl
                        );
                    }
                },
                templateUrl: 'modules/mapper/directives/propForm/propForm.html'
            }
        }
})();
