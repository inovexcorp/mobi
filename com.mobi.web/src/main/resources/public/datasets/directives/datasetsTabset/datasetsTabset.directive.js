(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name datasetsTabset
         *
         * @description
         * The `datasetsTabset` module only provides the `datasetsTabset` directive
         * which creates the main div containing the datasets page.
         */
        .module('datasetsTabset', [])
        /**
         * @ngdoc directive
         * @name datasetsTabset.directive:datasetsTabset
         * @scope
         * @restrict E
         * @requires datasetState.service:datasetStateService
         * @requires modal.service:modalService
         *
         * @description
         * `datasetsTabset` is a directive which creates a div containing a blue bar, a white bar, and the rest
         * of the datasets page. This includes a form for submitting a search query to retrieve datasets, a button
         * to open the {@link newDatasetOverlay.directive:newDatasetOverlay newDatasetOverlay}, and a
         * {@link datasetsList.directive:datasetsList datasetsList}. The list of results in
         * {@link datasetState.service:datasetStateService datasetStateService} is initialized by this directive.
         * The search text input is submitted on press of the enter key. The directive is replaced by the contents
         * of its template.
         */
        .directive('datasetsTabset', datasetsTabset);

        datasetsTabset.$inject = ['datasetStateService', 'modalService'];

        function datasetsTabset(datasetStateService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'datasets/directives/datasetsTabset/datasetsTabset.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = datasetStateService;

                    dvm.showNewOverlay = function() {
                        modalService.openModal('newDatasetOverlay');
                    }
                    dvm.onKeyUp = function(event) {
                        if (event.keyCode === 13) {
                            dvm.state.resetPagination();
                            dvm.state.setResults();
                            dvm.state.submittedSearch = !!dvm.state.paginationConfig.searchText;
                        }
                    }

                    dvm.state.setResults();
                    dvm.state.submittedSearch = !!dvm.state.paginationConfig.searchText;
                }
            }
        }
})();
