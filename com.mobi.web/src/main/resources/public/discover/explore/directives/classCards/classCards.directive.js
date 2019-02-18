(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name classCards
         *
         * @description
         * The `classCards` module only provides the `classCards` directive which creates a grid of cards
         * with all of the class details about a dataset record.
         */
        .module('classCards', [])
        /**
         * @ngdoc directive
         * @name classCards.directive:classCards
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         * @requires explore.service:exploreService
         * @requires util.service:utilService
         *
         * @description
         * `classCards` is a directive that creates a div which contains a 3 column grid used to display the
         * class details associated with a dataset record. The directive is replaced by the contents of its template.
         */
        .directive('classCards', classCards);

        classCards.$inject = ['discoverStateService', 'exploreService', 'utilService'];

        function classCards(discoverStateService, exploreService, utilService) {
            return {
                restrict: 'E',
                templateUrl: 'discover/explore/directives/classCards/classCards.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var ds = discoverStateService;
                    var es = exploreService;
                    var util = utilService;
                    dvm.chunks = getChunks(ds.explore.classDetails);

                    dvm.exploreData = function(item) {
                        es.getClassInstanceDetails(ds.explore.recordId, item.classIRI, {offset: 0, limit: ds.explore.instanceDetails.limit})
                            .then(response => {
                                ds.explore.classId = item.classIRI;
                                ds.explore.classDeprecated = item.deprecated;
                                ds.resetPagedInstanceDetails();
                                _.merge(ds.explore.instanceDetails, es.createPagedResultsObject(response));
                                ds.explore.breadcrumbs.push(item.classTitle);
                            }, util.createErrorToast);
                    }

                    $scope.$watch(() => ds.explore.classDetails, newValue => {
                        dvm.chunks = getChunks(newValue);
                    });

                    function getChunks(data) {
                        return _.chunk(_.orderBy(data, ['instancesCount', 'classTitle'], ['desc', 'asc']), 3);
                    }
                }]
            }
        }
})();