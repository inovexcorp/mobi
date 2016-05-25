(function() {
    'use strict';

    angular
        .module('propertyTree', [])
        .directive('propertyTree', propertyTree);

        function propertyTree() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/propertyTree/propertyTree.html',
                scope: {
                    headerText: '@'
                },
                bindToController: {
                    propertyType: '@'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var vm = $scope.$parent.vm;
                    var result = false;

                    dvm.state = vm.state;

                    function checkType(property) {
                        if(vm.isThisType(property, dvm.propertyType)) {
                            result = true;
                            return false;
                        }
                    }

                    dvm.selectItem = function(editor, oi, ci, pi) {
                        vm.selectItem(editor, oi, ci, pi);
                    }

                    dvm.isThisType = function(property, propertyType) {
                        return vm.isThisType(property, propertyType);
                    }

                    dvm.hasChildren = function(ontology) {
                        result = false;

                        _.forEach(_.get(ontology, 'matonto.noDomains', []), function(property) {
                            checkType(property);
                        });

                        if(!result) {
                            _.forEach(_.get(ontology, 'matonto.classes', []), function(classObj) {
                                _.forEach(_.get(classObj, 'matonto.properties', []), function(property) {
                                    checkType(property);
                                });
                            });
                        }

                        return result;
                    }
                }]
            }
        }
})();
