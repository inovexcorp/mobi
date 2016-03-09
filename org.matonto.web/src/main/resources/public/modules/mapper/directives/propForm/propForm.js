(function() {
    'use strict';

    angular
        .module('propForm', ['prefixes', 'ontologyManager'])
        .directive('propForm', propForm);

        propForm.$inject = ['prefixes', 'ontologyManagerService'];

        function propForm(prefixes, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    lastProp: '=',
                    ontologyId: '=',
                    classId: '=',
                    set: '&',
                    setNext: '&'
                },
                bindToController: {
                    props: '=',
                    selectedProp: '=ngModel',
                    isDatatypeProp: '&'
                },
                controller: function($scope) {
                    var dvm = this;
                    dvm.showPropBtns = false;

                    $scope.$watch('dvm.selectedProp', function(val) {
                        if (val) {
                            var propObj =_.find(dvm.props, {'@id': val});
                            if (ontologyManagerService.isObjectProp(propObj)) {
                                dvm.showPropBtns = true;
                            } else if (ontologyManagerService.isDatatypeProperty(propObj)) {
                                dvm.showPropBtns = false;
                                dvm.isDatatypeProp();
                            } else {
                                throw new Error("Can't find prop", val, "in", dvm.props);
                            }
                        }
                    });

                    dvm.isObjectProperty = function() {
                        return ontologyManagerService.isObjectProp(_.find(dvm.props, {'@id': dvm.selectedProp}));
                    }
                },
                templateUrl: 'modules/mapper/directives/propForm/propForm.html'
            }
        }
})();
