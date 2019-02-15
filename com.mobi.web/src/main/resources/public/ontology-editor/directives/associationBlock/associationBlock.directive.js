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
         * @name associationBlock
         *
         * @description
         * The `associationBlock` module only provides the `associationBlock` directive which creates a section for
         * displaying the classes and properties in an ontology.
         */
        .module('associationBlock', [])
        /**
         * @ngdoc directive
         * @name associationBlock.directive:associationBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `associationBlock` is a directive that creates a section that displays the
         * {@link everythingTree.directive:everythingTree} for the current
         * {@link ontologyState.service:ontologyStateService selected ontology}. The directive is replaced by the
         * contents of its template.
         */
        .directive('associationBlock', associationBlock);

        associationBlock.$inject = ['ontologyStateService'];

        function associationBlock(ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                },
                templateUrl: 'ontology-editor/directives/associationBlock/associationBlock.directive.html'
            }
        }
})();
