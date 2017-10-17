/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name downloadQueryOverlay
         *
         * @description
         * The `downloadQueryOverlay` module only provides the `downloadQueryOverlay` directive which creates
         * an overlay to download the results of a SPARQL query.
         */
        .module('downloadQueryOverlay', [])
        /**
         * @ngdoc directive
         * @name downloadQueryOverlay.directive:downloadQueryOverlay
         * @scope
         * @restrict E
         * @requires sparqlManager.service:sparqlManagerService
         *
         * @description
         * `downloadQueryOverlay` is a directive that creates an overlay with a form to download the results
         * of a {@link sparqlManager.service:sparqlManagerService#queryString SPARQL query}. The form includes
         * a selector for the file type and the file name. The directive is replaced by the contents of its
         * template.
         */
        .directive('downloadQueryOverlay', downloadQueryOverlay);

        downloadQueryOverlay.$inject = ['sparqlManagerService'];

        function downloadQueryOverlay(sparqlManagerService) {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var sparql = sparqlManagerService;
                    dvm.fileName = 'results';
                    dvm.fileType = 'csv';

                    dvm.download = function() {
                        sparql.downloadResults(dvm.fileType, dvm.fileName);
                        sparql.displayDownloadOverlay = false;
                    }
                    dvm.cancel = function() {
                        sparql.displayDownloadOverlay = false;
                    }
                },
                templateUrl: 'modules/discover/sub-modules/query/directives/downloadQueryOverlay/downloadQueryOverlay.html'
            }
        }
})();
