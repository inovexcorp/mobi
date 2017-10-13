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
        .module('ontologyCloseOverlay', [])
        .directive('ontologyCloseOverlay', ontologyCloseOverlay);

        ontologyCloseOverlay.$inject = ['$q', 'ontologyStateService'];

        function ontologyCloseOverlay($q, ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyCloseOverlay/ontologyCloseOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.error = '';

                    dvm.saveThenClose = function() {
                        dvm.os.saveChanges(dvm.os.listItem.ontologyRecord.recordId, {additions: dvm.os.listItem.additions, deletions: dvm.os.listItem.deletions})
                            .then(() => dvm.os.afterSave(), $q.reject)
                            .then(() => dvm.close(), errorMessage => dvm.error = errorMessage);
                    }

                    dvm.close = function() {
                        dvm.os.closeOntology(dvm.os.recordIdToClose);
                        dvm.os.showCloseOverlay = false;
                    }
                }
            }
        }
})();
