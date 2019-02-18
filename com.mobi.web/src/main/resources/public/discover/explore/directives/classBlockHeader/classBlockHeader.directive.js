(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name classBlockHeader
         *
         * @description
         * The `classBlockHeader` module only provides the `classBlockHeader` directive which creates
         * the dataset selector to determine what class details are to be shown on the page.
         */
        .module('classBlockHeader', [])
        /**
         * @ngdoc directive
         * @name classBlockHeader.directive:classBlockHeader
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         * @requires explore.service:exploreService
         * @requires exploreUtils.service:exploreUtilsService
         * @requires util.service:utilService
         * @requires modal.service:modalService
         *
         * @description
         * HTML contents in the class block header which provides a dropdown select to allow users to
         * pick a dataset to determine what class details are to be shown on the page.
         */
        .directive('classBlockHeader', classBlockHeader);

        classBlockHeader.$inject = ['discoverStateService', 'exploreService', 'exploreUtilsService', 'utilService', 'modalService'];

        function classBlockHeader(discoverStateService, exploreService, exploreUtilsService, utilService, modalService) {
            return {
                restrict: 'E',
                templateUrl: 'discover/explore/directives/classBlockHeader/classBlockHeader.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var es = exploreService;
                    var util = utilService;
                    dvm.ds = discoverStateService;
                    dvm.eu = exploreUtilsService;
                    dvm.showCreate = function() {
                        dvm.eu.getClasses(dvm.ds.explore.recordId)
                            .then(classes => {
                                modalService.openModal('newInstanceClassOverlay', {classes});
                            }, util.createErrorToast);
                    }
                    dvm.onSelect = function() {
                        es.getClassDetails(dvm.ds.explore.recordId)
                            .then(details => {
                                dvm.ds.explore.classDetails = details;
                            }, errorMessage => {
                                dvm.ds.explore.classDetails = [];
                                util.createErrorToast(errorMessage);
                            });
                    }
                }
            }
        }
})();