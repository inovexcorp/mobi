(function() {
    'use strict';

    angular
        .module('stepThroughSidebar', [])
        .directive('stepThroughSidebar', stepThroughSidebar);

        function stepThroughSidebar() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    activeIndex: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.steps = ['Choose File', 'Choose Mapping', 'Choose Ontology', 'Choose Base Class', 'Build Mapping', 'Upload as RDF'];
                },
                templateUrl: 'modules/mapper/directives/stepThroughSidebar/stepThroughSidebar.html'
            }
        }
})();
