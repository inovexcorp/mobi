/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
         * @name commitsTab
         *
         * @description
         * The `commitsTab` module only provides the `commitsTab` directive which creates a page for viewing the
         * commit history of an ontology.
         */
        .module('commitsTab', [])
        /**
         * @ngdoc directive
         * @name commitsTab.directive:commitsTab
         * @scope
         * @restrict E
         * @requires shared.service:ontologyStateService
         * @requires shared.service:utilService
         *
         * @description
         * `commitsTab` is a directive that creates a page containing the
         * {@link commitHistoryTable.directive:commitHistoryTable} for the current
         * {@link shared.service:ontologyStateService selected ontology} with a graph. It also creates a table
         * with buttons for viewing the ontology at each commit. The directive is replaced by the contents of its
         * template.
         */
        .directive('commitsTab', commitsTab);

        commitsTab.$inject = ['ontologyStateService', 'utilService', 'prefixes'];

        function commitsTab(ontologyStateService, utilService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/commitsTab/commitsTab.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.commits = [];

                    dvm.getHeadTitle = function() {
                        if (dvm.os.listItem.ontologyRecord.branchId) {
                            return dvm.util.getDctermsValue(_.find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId}), 'title');
                        } else {
                            var currentState = dvm.os.getCurrentStateByRecordId(dvm.os.listItem.ontologyRecord.recordId);
                            if (dvm.os.isStateTag(currentState)) {
                                var tagId = dvm.util.getPropertyId(currentState, prefixes.ontologyState + 'tag');
                                var tag = _.find(dvm.os.listItem.tags, {'@id': tagId});
                                return dvm.util.getDctermsValue(tag, 'title');
                            } else {
                                return '';
                            }
                        }
                    }
                    dvm.openOntologyAtCommit = function(commit) {
                        dvm.os.updateOntologyWithCommit(dvm.os.listItem.ontologyRecord.recordId, commit.id);
                    }
                }
            }
        }
})();
