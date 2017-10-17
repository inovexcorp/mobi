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
         * @name invalidOntologyOverlay
         *
         * @description
         * The `invalidOntologyOverlay` module only provides the `invalidOntologyOverlay` directive which creates
         * an overlay telling the user that the source ontologies for a mapping is incompatible.
         */
        .module('invalidOntologyOverlay', [])
        /**
         * @ngdoc directive
         * @name invalidOntologyOverlay.directive:invalidOntologyOverlay
         * @scope
         * @restrict E
         * @requires  mapperState.service:mapperStateService
         *
         * @description
         * `invalidOntologyOverlay` is a directive that creates an overlay with a message telling the user that the
         * source ontologies for a mapping is incompatible. The directive is replaced by the contents of its template.
         */
        .directive('invalidOntologyOverlay', invalidOntologyOverlay);

        invalidOntologyOverlay.$inject = ['mapperStateService'];

        function invalidOntologyOverlay(mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;

                    dvm.close = function() {
                        dvm.state.initialize();
                        dvm.state.invalidOntology = false;
                    }
                },
                templateUrl: 'modules/mapper/directives/invalidOntologyOverlay/invalidOntologyOverlay.html'
            }
        }
})();
