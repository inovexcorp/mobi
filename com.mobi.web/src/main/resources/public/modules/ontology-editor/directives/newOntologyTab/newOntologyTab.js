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
                    var date = new Date();
                    var prefix = 'https://mobi.com/ontologies/' + (date.getMonth() + 1) + '/' + date.getFullYear()
                        + '/';
                    var sm = stateManagerService;
                    var util = utilService;
                    var ontoUtils = ontologyUtilsManagerService;

                    dvm.prefixes = prefixes;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.os = ontologyStateService;
                    dvm.type = 'ontology';
                    dvm.ontology = {
                        '@id': prefix,
                        '@type': [prefixes.owl + 'Ontology']
                    };

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.ontology['@id'] = prefix + $filter('camelCase')(dvm.title, 'class');
                        }
                    }

                    dvm.create = function() {
                        util.setDctermsValue(dvm.ontology, 'title', dvm.title);
                        if (dvm.description) {
                            util.setDctermsValue(dvm.ontology, 'description', dvm.description);
                        }
                        ontoUtils.addLanguageToNewEntity(dvm.ontology, dvm.language);
                        if (dvm.type === 'vocabulary') {
                            dvm.ontology[prefixes.owl + 'imports'] = [{
                                '@id': angular.copy(prefixes.skos).slice(0, -1)
                            }];
                        }
                        dvm.os.createOntology(dvm.ontology, dvm.title, dvm.description, _.join(_.map(dvm.keywords, _.trim), ','), dvm.type)
                            .then(response => sm.createOntologyState(response.recordId, response.branchId, response.commitId), $q.reject)
                            .then(() => {
                                if (dvm.type === 'vocabulary') {
                                    return dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, 'vocabulary', true, dvm.os.listItem.inProgressCommit, true);
                                }
                                return $q.resolve();
                            }, onError)
                            .then(() => dvm.os.showNewTab = false, onError);
                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }
                }
            }
        }
})();
