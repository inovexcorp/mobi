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
                    lastProp: '=',
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
                    dvm.showPropBtns = false;

                    dvm.update = function() {
                        $timeout(function() {
                            if (dvm.selectedProp) {
                                var propObj =_.find(dvm.props, {'@id': dvm.selectedProp});
                                if (ontologyManagerService.isObjectProp(propObj)) {
                                    dvm.showPropBtns = true;
                                    dvm.isObjectProp();
                                } else if (ontologyManagerService.isDatatypeProperty(propObj)) {
                                    dvm.showPropBtns = false;
                                    dvm.isDatatypeProp();
                                } else {
                                    throw new Error("Can't find prop", dvm.selectedProp, "in", dvm.props);
                                }
                            }
                        });
                    }

                    dvm.isObjectProperty = function() {
                        return ontologyManagerService.isObjectProp(_.find(dvm.props, {'@id': dvm.selectedProp}));
                    }
                },
                templateUrl: 'modules/mapper/directives/propForm/propForm.html'
            }
        }
})();
