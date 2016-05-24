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
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.hasChildren = function(ontology) {
                        if(_.get(ontology, 'matonto.noDomains', []).length) {
                            return true;
                        }

                        _.forEach(_.get(ontology, 'matonto.classes', []), function(classObj) {
                            if(_.get(classObj, 'matonto.properties', []).length) {
                                console.log('here');
                                return true;
                            }
                        });

                        return false;
                    }
                },
                link: function(scope, element, attrs) {
                    scope.headerText = attrs.headerText;
                    scope.propertyType = attrs.propertyType;
                }
            }
        }
})();
