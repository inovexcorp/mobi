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
        .module('ontologyTab', [])
        /**
         * @ngdoc directive
         * @name ontologyTab.directive:ontologyTab
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `ontologyTab` is a directive that creates a `div` containing all the directives necessary for
         * displaying an ontology. This includes a {@link mergeTab.directive:mergeTab},
         * {@link ontologyButtonStack.directive:ontologyButtonStack}, and
         * {@link materialTabset.directive:materialTabset}. The `materialTabset` contains tabs for the
         * {@link projectTab.directive:projectTab}, {@link overviewTab.directive:overviewTab},
         * {@link classesTab.directive:classesTab}, {@link propertiesTab.directive:propertiesTab},
         * {@link individualsTab.directive:individualsTab}, {@link conceptSchemesTab.directive:conceptSchemesTab},
         * {@link conceptsTab.directive:conceptsTab}, {@link searchTab.directive:searchTab},
         * {@link savedChangesTab.directive:savedChangesTab}, and {@link commitsTab.directive:commitsTab}. The
         * directive is replaced by the contents of its template.
         */
        .directive('ontologyTab', ontologyTab);

        ontologyTab.$inject = ['ontologyStateService'];

        function ontologyTab(ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyTab/ontologyTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.sm = ontologyStateService;
                    dvm.savedChanges = '<i class="fa fa-exclamation-triangle"></i> Changes';
                }
            }
        }
})();
