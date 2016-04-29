(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name resultList
         * @requires catalogManager
         *
         * @description 
         * The `resultList` module only provides the `resultList` directive which creates
         * a sortable paginated list of resources.
         */
        .module('resultList', ['catalogManager'])
        /**
         * @ngdoc directive
         * @name resultList.directive:resultList
         * @scope
         * @restrict E
         * @requires catalogManager.catalogManagerService
         *
         * @description 
         * `resultList` is a directive that creates a sortable paginated list of resources. 
         * The directive is replaced by the content of the template. The directive is split 
         * into three main divs: '.results-header' which contains information about the 
         * current page and a ordering select box, '.results-list' which contains the series
         * of divs for each resource in the list, and '.page-nav' with pagination buttons. 
         * The title of each resource in the results list is clickable. Each resource also 
         * has a download button.
         *
         * @param {Object} results A paginated results object
         * @param {Object} results.links An object containing URLS and paths to previous and
         * next pages in the results list.
         * @param {number} results.limit The number of resources per page
         * @param {Object[]} results.results The array of resource objects representing the 
         * results
         * @param {number} results.size The number of results on the page represented by this 
         * object
         * @param {number} results.start The index of the first result in the page represented 
         * by this object
         * @param {string} orderBy The key of a resource object to sort the results by
         * @param {number} currentPage The index of the current page
         * @param {function} clickResource The function to be called if a resource's title is 
         * clicked
         * @param {function} changeOrder The function to be called when the ordering select box
         * is changed
         * @param {function} clickLink The function to be called when a pagination button is 
         * clicked
         * @param {function} download The function to be called when a resource's download button
         * is clicked
         *
         * @usage
         * <result-list results="{links: {base: 'https://localhost:8443/matontorest/', context: 'catalog/resources', self: 'https:/localhost:8443/matontorest/catalog/resources'}, limit: 10, results: [], size: 0, start: 0}"
         *     order-by="'title'"
         *     current-page="0"
         *     click-resource="console.log('Resource has been clicked')"
         *     change-order="console.log('Order has been changed')"
         *     click-link="console.log('Page has been changed')"
         *     download="console.log('Resource has been downloaded')"></result-list>
         */
        .directive('resultList', resultList);

        resultList.$inject = ['catalogManagerService'];

        function resultList(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    results: '=',
                    orderBy: '=',
                    currentPage: '=',
                    clickResource: '&',
                    changeOrder: '&',
                    clickLink: '&',
                    download: '&'
                },
                controller: function() {
                    var dvm = this;

                    dvm.getDate = function(date) {
                        var jsDate = catalogManagerService.getDate(date);
                        return jsDate.toDateString();
                    }
                },
                templateUrl: 'modules/catalog/directives/resultList/resultList.html'
            }
        }
})();
