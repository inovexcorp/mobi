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

        removePropertyOverlay.$inject = ['ontologyStateService', 'propertyManagerService', 'ontologyUtilsManagerService', 'prefixes', 'ontologyManagerService'];

        function removePropertyOverlay(ontologyStateService, propertyManagerService, ontologyUtilsManagerService, prefixes, ontologyManagerService) {
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
                    dvm.os = ontologyStateService;
                    dvm.pm = propertyManagerService;

                    dvm.getValueDisplay = function() {
                        return _.get(dvm.os.listItem.selected[dvm.key], '[' + dvm.index + ']["@value"]')
                            || _.truncate(ontoUtils.getBlankNodeValue(_.get(dvm.os.listItem.selected[dvm.key], '[' + dvm.index + ']["@id"]')), {length: 150})
                            || _.get(dvm.os.listItem.selected[dvm.key], '[' + dvm.index + ']["@id"]');
                    }
                    dvm.removeProperty = function() {
                        if (dvm.onSubmit) {
                            dvm.onSubmit({axiomObject: dvm.os.listItem.selected[dvm.key][dvm.index]});
                        }
                        var json = {
                            '@id': dvm.os.listItem.selected['@id'],
                            [dvm.key]: [angular.copy(dvm.os.listItem.selected[dvm.key][dvm.index])]
                        };
                        dvm.os.addToDeletions(dvm.os.listItem.ontologyRecord.recordId, json);
                        if (om.isBlankNodeId(dvm.os.listItem.selected[dvm.key][dvm.index]['@id'])) {
                            var removed = dvm.os.removeEntity(dvm.os.listItem, dvm.os.listItem.selected[dvm.key][dvm.index]['@id']);
                            _.forEach(removed, entity => dvm.os.addToDeletions(dvm.os.listItem.ontologyRecord.recordId, entity));
                        }
                        dvm.pm.remove(dvm.os.listItem.selected, dvm.key, dvm.index);
                        if (prefixes.rdfs + 'domain' === dvm.key && !om.isBlankNodeId(dvm.os.listItem.selected[dvm.key][dvm.index]['@id'])) {
                            dvm.os.listItem.flatEverythingTree = dvm.os.createFlatEverythingTree(dvm.os.getOntologiesArray(), dvm.os.listItem);
                        } else if (prefixes.rdfs + 'range' === dvm.key) {
                            dvm.os.updatePropertyIcon(dvm.os.listItem.selected);
                        }
                        dvm.overlayFlag = false;
                        ontoUtils.saveCurrentChanges();
                        ontoUtils.updateLabel();
                    }
                }
            }
        }
})();
