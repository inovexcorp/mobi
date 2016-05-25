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

                    dvm.state = vm.state;

                    dvm.selectItem = function(editor, oi, ci, pi) {
                        vm.selectItem(editor, oi, ci, pi);
                    }

                    dvm.isThisType = function(property, propertyType) {
                        return vm.isThisType(property, propertyType);
                    }

                    dvm.hasChildren = function(ontology) {
                        var result = _.some(_.get(ontology, 'matonto.noDomains', []), function(property) {
                            return vm.isThisType(property, dvm.propertyType);
                        });

                        if(!result) {
                            _.forEach(_.get(ontology, 'matonto.classes', []), function(classObj) {
                                result = _.some(_.get(classObj, 'matonto.properties', []), function(property) {
                                    return vm.isThisType(property, dvm.propertyType);
                                });

                                if(result) {
                                    return false;
                                }
                            });
                        }

                        return result;
                    }
                }]
            }
        }
})();
