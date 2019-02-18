(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name instanceEditor
         *
         * @description
         * The `instanceEditor` module only provides the `instanceEditor` directive which creates
         * the instance editor page.
         */
        .module('instanceEditor', [])
        /**
         * @ngdoc directive
         * @name instanceEditor.directive:instanceEditor
         * @scope
         * @restrict E
         * @requires $q
         * @requires discoverState.service:discoverStateService
         * @requires util.service:utilService
         * @requires explore.service:exploreService
         * @requires exploreUtils.service:exploreUtilsService
         *
         * @description
         * HTML contents in the instance view page which shows the complete list of properites
         * associated with the selected instance in an editable format.
         */
        .directive('instanceEditor', instanceEditor);

        instanceEditor.$inject = ['$q', 'discoverStateService', 'utilService', 'exploreService', 'exploreUtilsService'];

        function instanceEditor($q, discoverStateService, utilService, exploreService, exploreUtilsService) {
            return {
                restrict: 'E',
                templateUrl: 'discover/explore/directives/instanceEditor/instanceEditor.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var es = exploreService;
                    var eu = exploreUtilsService;
                    dvm.ds = discoverStateService;
                    dvm.util = utilService;
                    dvm.isValid = true;

                    dvm.save = function() {
                        dvm.ds.explore.instance.entity = eu.removeEmptyPropertiesFromArray(dvm.ds.explore.instance.entity);
                        var instance = dvm.ds.getInstance();
                        es.updateInstance(dvm.ds.explore.recordId, dvm.ds.explore.instance.metadata.instanceIRI, dvm.ds.explore.instance.entity)
                            .then(() => es.getClassInstanceDetails(dvm.ds.explore.recordId, dvm.ds.explore.classId, {offset: (dvm.ds.explore.instanceDetails.currentPage - 1) * dvm.ds.explore.instanceDetails.limit, limit: dvm.ds.explore.instanceDetails.limit}), $q.reject)
                            .then(response => {
                                dvm.ds.explore.instanceDetails.data = response.data;
                                dvm.ds.explore.instance.metadata = _.find(response.data, {instanceIRI: instance['@id']});
                                dvm.ds.explore.breadcrumbs[dvm.ds.explore.breadcrumbs.length - 1] = dvm.ds.explore.instance.metadata.title;
                                dvm.ds.explore.editing = false;
                            }, dvm.util.createErrorToast);
                    }

                    dvm.cancel = function() {
                        dvm.ds.explore.instance.entity = dvm.ds.explore.instance.original;
                        dvm.ds.explore.editing = false;
                    }
                }
            }
        }
})();