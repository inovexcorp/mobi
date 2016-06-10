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
                    propertyType: '@',
                    selectItem: '&',
                    state: '=',
                    ontologies: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', 'prefixes', function($scope, prefixes) {
                    var dvm = this;

                    dvm.isThisType = function(property, propertyType) {
                        var lowerCasePropertyTypeIRI = (prefixes.owl + propertyType).toLowerCase();
                        return _.findIndex(_.get(property, '@type', []), function(type) {
                            return type.toLowerCase() === lowerCasePropertyTypeIRI;
                        }) !== -1;
                    }

                    dvm.hasChildren = function(ontology) {
                        var result = _.some(_.get(ontology, 'matonto.noDomains', []), function(property) {
                            return dvm.isThisType(property, dvm.propertyType);
                        });

                        if(!result) {
                            result = _.some(_.get(ontology, 'matonto.classes', []), function(classObj) {
                                return _.some(_.get(classObj, 'matonto.properties', []), function(property) {
                                    return dvm.isThisType(property, dvm.propertyType);
                                });
                            });
                        }

                        return result;
                    }
                }]
            }
        }
})();
