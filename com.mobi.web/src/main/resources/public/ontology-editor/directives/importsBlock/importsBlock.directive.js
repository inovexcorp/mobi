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
         * @name importsBlock
         *
         * @description
         * The `importsBlock` module only provides the `importsBlock` directive which creates a section for displaying
         * the imports of an ontology.
         */
        .module('importsBlock', [])
        .config(ignoreUnhandledRejectionsConfig)
        /**
         * @ngdoc directive
         * @name importsBlock.directive:importsBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         * @requires propertyManager.service:propertyManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `importsBlock` is a directive that creates a section that displays the imports on the current
         * {@link ontologyState.service:ontologyStateService selected ontology}. The section contains buttons for
         * adding an import and reloading the imports. Each import is displayed as its IRI and with a remove button.
         * The directive houses the methods for opening the modal for
         * {@link importsOverlay.directive:importsOverlay adding} and removing imports. The directive is replaced by the
         * contents of its template.
         */
        .directive('importsBlock', importsBlock);

        importsBlock.$inject = ['$q', '$timeout', 'ontologyStateService', 'prefixes', 'utilService', 'propertyManagerService', 'modalService'];

        function importsBlock($q, $timeout, ontologyStateService, prefixes, utilService, propertyManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/importsBlock/importsBlock.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var util = utilService;
                    var pm = propertyManagerService;
                    dvm.prefixes = prefixes;
                    dvm.os = ontologyStateService;
                    dvm.showRemoveOverlay = false;
                    dvm.indirectImports = [];

                    dvm.setupRemove = function(url) {
                        dvm.url = url;
                        dvm.showRemoveOverlay = true;
                        var msg = '';
                        if (dvm.os.hasChanges(dvm.os.listItem)) {
                            msg = '<p><strong>NOTE: You have some unsaved changes.</strong></p><p>Would you like to save those changes and remove the import: <strong>' + url + '</strong>?</p>';
                        } else {
                            msg = '<p>Are you sure you want to remove the import: <strong>' + url + '</strong>?</p>';
                        }
                        modalService.openConfirmModal(msg, dvm.remove);
                    }
                    dvm.remove = function() {
                        var importsIRI = dvm.prefixes.owl + 'imports';
                        dvm.os.addToDeletions(dvm.os.listItem.ontologyRecord.recordId, util.createJson(dvm.os.listItem.selected['@id'], importsIRI, {'@id': dvm.url}));
                        pm.remove(dvm.os.listItem.selected, importsIRI, _.findIndex(dvm.os.listItem.selected[importsIRI], {'@id': dvm.url}));
                        dvm.os.saveChanges(dvm.os.listItem.ontologyRecord.recordId, {additions: dvm.os.listItem.additions, deletions: dvm.os.listItem.deletions})
                            .then(() => dvm.os.afterSave(), $q.reject)
                            .then(() => dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, dvm.os.listItem.upToDate, dvm.os.listItem.inProgressCommit), $q.reject)
                            .then(() => {
                                dvm.os.listItem.isSaved = dvm.os.isCommittable(dvm.os.listItem);
                                dvm.setIndirectImports();
                            }, util.createErrorToast);
                    }
                    dvm.get = function(obj) {
                        return _.get(obj, '@id');
                    }
                    dvm.failed = function(iri) {
                        return _.includes(dvm.os.listItem.failedImports, iri);
                    }
                    dvm.refresh = function() {
                        dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, dvm.os.listItem.upToDate, dvm.os.listItem.inProgressCommit, true)
                            .then(response => {
                                dvm.setIndirectImports();
                                util.createSuccessToast('');
                            }, util.createErrorToast);
                    }
                    dvm.setIndirectImports = function() {
                        var directImports = _.map(_.get(dvm.os.listItem.selected, prefixes.owl + 'imports'), '@id');
                        var goodImports = _.map(dvm.os.listItem.importedOntologies, item => _.pick(item, 'id', 'ontologyId'));
                        var failedImports = _.map(dvm.os.listItem.failedImports, iri => ({ id: iri, ontologyId: iri }));
                        var allImports = _.concat(goodImports, failedImports);
                        var filtered = _.reject(allImports, item => _.includes(directImports, item.id) || _.includes(directImports, item.ontologyId));
                        dvm.indirectImports = _.sortBy(_.map(filtered, 'ontologyId'));
                    }
                    dvm.showNewOverlay = function() {
                        modalService.openModal('importsOverlay', {}, dvm.setIndirectImports);
                    }

                    $timeout(dvm.setIndirectImports);

                    $scope.$watch('dvm.os.listItem', dvm.setIndirectImports);
                }]
            }
        }
})();
