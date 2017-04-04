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
        .module('importsBlock', [])
        .directive('importsBlock', importsBlock);

        importsBlock.$inject = ['$q', 'ontologyStateService', 'prefixes', 'utilService', 'propertyManagerService'];

        function importsBlock($q, ontologyStateService, prefixes, utilService, propertyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/importsBlock/importsBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var util = utilService;
                    var pm = propertyManagerService;
                    dvm.prefixes = prefixes;
                    dvm.os = ontologyStateService;
                    dvm.showNewOverlay = false;
                    dvm.showRemoveOverlay = false;

                    dvm.setupRemove = function(url, index) {
                        dvm.url = url;
                        dvm.index = index;
                        dvm.showRemoveOverlay = true;
                    }

                    dvm.remove = function() {
                        var importsIRI = dvm.prefixes.owl + 'imports';
                        dvm.os.addToDeletions(dvm.os.listItem.recordId, util.createJson(dvm.os.selected['@id'], importsIRI, {'@id': dvm.url}));
                        pm.remove(dvm.os.selected, importsIRI, dvm.index);
                        dvm.os.saveChanges(dvm.os.listItem.recordId, {additions: dvm.os.listItem.additions, deletions: dvm.os.listItem.deletions})
                            .then(() => dvm.os.afterSave(), $q.reject)
                            .then(() => dvm.os.updateOntology(dvm.os.listItem.recordId, dvm.os.listItem.branchId, dvm.os.listItem.commitId, dvm.os.listItem.type, dvm.os.listItem.upToDate, dvm.os.listItem.inProgressCommit), $q.reject)
                            .then(() => {
                                dvm.os.listItem.isSaved = dvm.os.isCommittable(dvm.os.listItem.recordId);
                                dvm.showRemoveOverlay = false;
                            }, errorMessage => dvm.error = errorMessage);
                    }

                    dvm.get = function(obj) {
                        return _.get(obj, '@id');
                    }
                }
            }
        }
})();
