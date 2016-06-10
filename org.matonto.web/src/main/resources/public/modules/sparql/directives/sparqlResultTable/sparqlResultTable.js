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
                    var dvm = this;

                    dvm.sparql = sparqlManagerService;

                    dvm.getPage = function(direction) {
                        if(direction === 'next') {
                            dvm.sparql.currentPage += 1;
                            sparqlManagerService.getResults(dvm.sparql.data.paginatedResults.links.base + dvm.sparql.data.paginatedResults.links.next);
                        } else {
                            dvm.sparql.currentPage -= 1;
                            sparqlManagerService.getResults(dvm.sparql.data.paginatedResults.links.base + dvm.sparql.data.paginatedResults.links.prev);
                        }
                    }
                }],
                link: function(scope, element) {
                    var resize = function() {
                        var totalHeight = document.getElementsByClassName('sparql')[0].clientHeight;
                        var topHeight = document.getElementsByClassName('sparql-editor')[0].clientHeight;
                        var pagingHeight = element[0].querySelector('.paging-details').clientHeight;
                        element.css({'height': (totalHeight - topHeight) + 'px', 'padding-bottom': (pagingHeight + 10) + 'px'});
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
