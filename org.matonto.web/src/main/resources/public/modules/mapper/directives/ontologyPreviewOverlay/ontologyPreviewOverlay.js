/*-
 * #%L
 * org.matonto.web
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
         * @name ontologyPreviewOverlay
         *
         * @description 
         * The `ontologyPreviewOverlay` module only provides the `ontologyPreviewOverlay` directive 
         * which creates an overlay containing an {@link ontologyPreview.directive:ontologyPreview ontologyPreview}
         * of the passed ontology.
         */
        .module('ontologyPreviewOverlay', [])
        /**
         * @ngdoc directive
         * @name ontologyPreviewOverlay.directive:ontologyPreviewOverlay
         * @scope
         * @restrict E
         * @requires  prefixes.service:prefixes
         * @requires  ontologyManager.service:ontologyManagerService
         *
         * @description 
         * `ontologyPreviewOverlay` is a directive which creates an overlay containing a 
         * {@link ontologyPreview.directive:ontologyPreview} of the passed ontology object.
         * The directive is replaced by the contents of its template.
         *
         * @param {object} ontology an ontology object from the {@link ontologyManager.service:ontologyManagerService ontologyManagerService}
         */
        .directive('ontologyPreviewOverlay', ontologyPreviewOverlay);

        ontologyPreviewOverlay.$inject = ['ontologyManagerService', 'mapperStateService'];

        function ontologyPreviewOverlay(ontologyManagerService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    ontology: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.state = mapperStateService;
                },
                templateUrl: 'modules/mapper/directives/ontologyPreviewOverlay/ontologyPreviewOverlay.html'
            }
        }
})();
