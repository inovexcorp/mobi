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
        .module('removePropertyOverlay', [])
        .directive('removePropertyOverlay', removePropertyOverlay);

        removePropertyOverlay.$inject = ['ontologyStateService', 'propertyManagerService', 'ontologyManagerService', 'ontologyUtilsManagerService'];

        function removePropertyOverlay(ontologyStateService, propertyManagerService, ontologyManagerService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/removePropertyOverlay/removePropertyOverlay.html',
                scope: {},
                bindToController: {
                    index: '<',
                    key: '<',
                    onSubmit: '&?',
                    overlayFlag: '='
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var ontoUtils = ontologyUtilsManagerService;
                    dvm.sm = ontologyStateService;
                    dvm.pm = propertyManagerService;

                    dvm.removeProperty = function() {
                        if (dvm.onSubmit) {
                            dvm.onSubmit({axiomObject: dvm.sm.selected[dvm.key][dvm.index]});
                        }
                        var json = {
                            '@id': dvm.sm.selected['@id'],
                            [dvm.key]: [angular.copy(dvm.sm.selected[dvm.key][dvm.index])]
                        }
                        om.addToDeletions(dvm.sm.listItem.recordId, json);
                        dvm.pm.remove(dvm.sm.selected, dvm.key, dvm.index);
                        dvm.overlayFlag = false;
                        ontoUtils.saveCurrentChanges();
                    }
                }
            }
        }
})();
