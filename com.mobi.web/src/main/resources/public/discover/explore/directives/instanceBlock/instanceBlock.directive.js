(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name instanceBlock
         *
         * @description
         * The `instanceBlock` module only provides the `instanceBlock` directive which creates
         * the instance block which shows the users instance cards associated with the selected
         * class.
         */
        .module('instanceBlock', [])
        /**
         * @ngdoc directive
         * @name instanceBlock.directive:instanceBlock
         * @scope
         * @restrict E
         * @requires $http
         * @requires $filter
         * @requires discoverState.service:discoverStateService
         * @requires explore.service:exploreService
         * @requires util.service:utilService
         * @requires uuid
         *
         * @description
         * HTML contents in the instance block which shows the users the instances associated
         * with the class they have selected. They have a bread crumb trail to get back to early
         * pages and pagination controls at the bottom of the page.
         */
        .directive('instanceBlock', instanceBlock);

        instanceBlock.$inject = ['$filter', 'discoverStateService', 'exploreService', 'utilService', 'uuid'];

        function instanceBlock($filter, discoverStateService, exploreService, utilService, uuid) {
            return {
                restrict: 'E',
                templateUrl: 'discover/explore/directives/instanceBlock/instanceBlock.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var es = exploreService;
                    var util = utilService;
                    dvm.ds = discoverStateService;

                    dvm.setPage = function() {
                        var pagingObj = {
                            limit: dvm.ds.explore.instanceDetails.limit,
                            offset: (dvm.ds.explore.instanceDetails.currentPage - 1) * dvm.ds.explore.instanceDetails.limit
                        };
                        es.getClassInstanceDetails(dvm.ds.explore.recordId, dvm.ds.explore.classId, pagingObj)
                            .then(response => {
                                dvm.ds.explore.instanceDetails.data = [];
                                _.merge(dvm.ds.explore.instanceDetails, es.createPagedResultsObject(response));
                            }, util.createErrorToast);
                    }

                    dvm.create = function() {
                        dvm.ds.explore.creating = true;
                        var split = $filter('splitIRI')(_.head(dvm.ds.explore.instanceDetails.data).instanceIRI);
                        var iri = split.begin + split.then + uuid.v4();
                        dvm.ds.explore.instance.entity = [{
                            '@id': iri,
                            '@type': [dvm.ds.explore.classId]
                        }];
                        dvm.ds.explore.instance.metadata.instanceIRI = iri;
                        dvm.ds.explore.breadcrumbs.push('New Instance');
                    }

                    dvm.getClassName = function() {
                        return _.last(dvm.ds.explore.breadcrumbs);
                    }
                }
            }
        }
})();