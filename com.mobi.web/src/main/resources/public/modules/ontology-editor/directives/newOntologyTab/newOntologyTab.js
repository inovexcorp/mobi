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
        .module('newOntologyTab', [])
        .directive('newOntologyTab', newOntologyTab);

        newOntologyTab.$inject = ['$q', '$filter', 'REGEX', 'ontologyStateService', 'prefixes', 'stateManagerService', 'utilService', 'ontologyUtilsManagerService'];

        function newOntologyTab($q, $filter, REGEX, ontologyStateService, prefixes, stateManagerService, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/newOntologyTab/newOntologyTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var sm = stateManagerService;
                    var util = utilService;
                    var ontoUtils = ontologyUtilsManagerService;

                    dvm.prefixes = prefixes;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.os = ontologyStateService;

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            var split = $filter('splitIRI')(dvm.os.newOntology['@id']);
                            dvm.os.newOntology['@id'] = split.begin + split.then + $filter('camelCase')(util.getPropertyValue(dvm.os.newOntology, prefixes.dcterms + 'title'), 'class');
                        }
                    }

                    dvm.create = function() {
                        var title = util.getPropertyValue(dvm.os.newOntology, prefixes.dcterms + 'title');
                        var description = util.getPropertyValue(dvm.os.newOntology, prefixes.dcterms + 'description');
                        if (!description) {
                            delete dvm.os.newOntology[prefixes.dcterms + 'description'];
                        }
                        ontoUtils.addLanguageToNewEntity(dvm.os.newOntology, dvm.os.newLanguage);
                        dvm.os.createOntology(dvm.os.newOntology, title, description, _.map(dvm.os.newKeywords, _.trim))
                            .then(response => sm.createOntologyState(response.recordId, response.branchId, response.commitId), $q.reject)
                            .then(() => dvm.os.showNewTab = false, onError);
                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }
                }
            }
        }
})();
