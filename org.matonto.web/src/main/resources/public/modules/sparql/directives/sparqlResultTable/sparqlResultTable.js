(function() {
    'use strict';

    angular
        .module('sparqlResultTable', ['sparqlManager'])
        .directive('sparqlResultTable', sparqlResultTable);

        sparqlResultTable.$inject = ['$window', '$timeout'];

        function sparqlResultTable($window, $timeout) {
            return {
                restrict: 'E',
                templateUrl: 'modules/sparql/directives/sparqlResultTable/sparqlResultTable.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: ['sparqlManagerService', function(sparqlManagerService) {
                    this.sparqlManagerService = sparqlManagerService;
                }],
                link: function(scope, element) {
                    var resize = function() {
                        var totalHeight = document.getElementsByClassName('sparql')[0].clientHeight;
                        var topHeight = document.getElementsByClassName('sparql-editor')[0].clientHeight;
                        element.css('height', (totalHeight - topHeight) + 'px');
                    }

                    angular.element($window).bind('resize', function() {
                        resize();
                    });

                    $timeout(function() {
                        resize();
                    });

                    element.on('$destroy', function() {
                        angular.element($window).off('resize');
                    });
                }
            }
        }
})();
