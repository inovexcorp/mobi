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
        .module('savedChangesTab', [])
        .directive('savedChangesTab', savedChangesTab);

        savedChangesTab.$inject = ['$filter', '$q', 'ontologyStateService', 'ontologyManagerService', 'stateManagerService', 'utilService', 'catalogManagerService', 'prefixes'];

        function savedChangesTab($filter, $q, ontologyStateService, ontologyManagerService, stateManagerService, utilService, catalogManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/savedChangesTab/savedChangesTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', '$element', function($scope, $element) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var om = ontologyManagerService;
                    var sm = stateManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');
                    var typeIRI = prefixes.rdf + 'type';
                    var types = [prefixes.owl + 'Class', prefixes.owl + 'ObjectProperty', prefixes.owl + 'DatatypeProperty', prefixes.owl + 'AnnotationProperty', prefixes.owl + 'NamedIndividual', prefixes.skos + 'Concept', prefixes.skos + 'ConceptScheme'];
                    
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.list = [];
                    dvm.checkedStatements = {
                        additions: [],
                        deletions: []
                    };

                    dvm.go = function($event, id) {
                        $event.stopPropagation();
                        dvm.os.goTo(id);
                    }

                    dvm.update = function() {
                        cm.getBranchHeadCommit(dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.recordId, catalogId)
                            .then(headCommit => {
                                var commitId = _.get(headCommit, "commit['@id']", '');
                                return dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, commitId);
                            }, $q.reject)
                            .then(() => dvm.util.createSuccessToast('Your ontology has been updated.'), dvm.util.createErrorToast);
                    }

                    dvm.restoreBranchWithUserBranch = function() {
                        var userBranchId = dvm.os.listItem.ontologyRecord.branchId;
                        var userBranch = _.find(dvm.os.listItem.branches, {'@id': userBranchId})
                        var createdFromId = dvm.util.getPropertyId(userBranch, prefixes.catalog + 'createdFrom');
                        var branchConfig = {
                            title: dvm.util.getDctermsValue(userBranch, 'title'),
                            description: dvm.util.getDctermsValue(userBranch, 'description')
                        };

                        var createdBranchId;
                        cm.createRecordBranch(dvm.os.listItem.ontologyRecord.recordId, catalogId, branchConfig, dvm.os.listItem.ontologyRecord.commitId)
                            .then(branchId => {
                                createdBranchId = branchId;
                                return cm.getRecordBranch(branchId, dvm.os.listItem.ontologyRecord.recordId, catalogId);
                            }, $q.reject)
                            .then(branch => {
                                dvm.os.listItem.branches.push(branch);
                                dvm.os.listItem.ontologyRecord.branchId = branch['@id'];
                                var commitId = dvm.util.getPropertyId(branch, prefixes.catalog + 'head');
                                return sm.updateOntologyState(dvm.os.listItem.ontologyRecord.recordId, createdBranchId, commitId);
                            }, $q.reject)
                            .then(() => {
                                return om.deleteOntology(dvm.os.listItem.ontologyRecord.recordId, userBranchId);
                            }, $q.reject)
                            .then(() => {
                                dvm.os.removeBranch(dvm.os.listItem.ontologyRecord.recordId, userBranchId);
                                changeUserBranchesCreatedFrom(createdFromId, createdBranchId);
                                dvm.util.createSuccessToast('Branch has been restored with changes.');
                            }, dvm.util.createErrorToast);
                    }

                    dvm.removeChanges = function() {
                        cm.deleteInProgressCommit(dvm.os.listItem.ontologyRecord.recordId, catalogId)
                            .then(() => dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, dvm.os.listItem.upToDate), $q.reject)
                            .then(() => dvm.os.clearInProgressCommit(), errorMessage => dvm.error = errorMessage);
                    }

                    dvm.orderByIRI = function(item) {
                        return dvm.util.getBeautifulIRI(item.id);
                    }

                    $scope.$watchGroup(['dvm.os.listItem.inProgressCommit.additions', 'dvm.os.listItem.inProgressCommit.deletions'], () => {
                        var ids = _.unionWith(_.map(dvm.os.listItem.inProgressCommit.additions, '@id'), _.map(dvm.os.listItem.inProgressCommit.deletions, '@id'), _.isEqual);
                        dvm.list = _.map(ids, id => {
                            var additions = dvm.util.getChangesById(id, dvm.os.listItem.inProgressCommit.additions);
                            var deletions = dvm.util.getChangesById(id, dvm.os.listItem.inProgressCommit.deletions);

                            var addition, deletion;
                            var addStr = "", delStr = "";
                            var parent = angular.element(document.getElementsByClassName('changes'));

                            var div = angular.element("<div></div>");
                            parent.append(div);
                            var listSize = 300;
                            
                            var fullObject, o;
                            var filter = $filter;
                            
                            if (additions !== undefined) {
                                _.forEach(additions, (addition => {
                                    if (_.has(addition.o, '@id')) {
                                        fullObject = addition.o['@id'];
                                        o = filter('splitIRI')(fullObject).end || fullObject;
                                    } else {
                                        o = _.get(addition.o, '@value', addition.o)
                                            + (_.has(addition.o, '@language') ? ' [language: ' + addition.o['@language'] + ']' : '')
                                            + (_.has(addition.o, '@type') ? ' [type: ' + filter('prefixation')(addition.o['@type']) + ']' : '');
                                        fullObject = o;
                                    }
                                    div.append(o + "<br/>");
                                })); 
                            }
                            div.append("<br/>")
                            if (deletions !== undefined) {
                                _.forEach(deletions, (deletion => {
                                    if (_.has(deletion.o, '@id')) {
                                        fullObject = deletion.o['@id'];
                                        o = filter('splitIRI')(fullObject).end || fullObject;
                                    } else {
                                        o = _.get(deletion.o, '@value', deletion.o)
                                            + (_.has(deletion.o, '@language') ? ' [language: ' + deletion.o['@language'] + ']' : '')
                                            + (_.has(deletion.o, '@type') ? ' [type: ' + filter('prefixation')(deletion.o['@type']) + ']' : '');
                                        fullObject = o;
                                    }
                                    div.append(o + "<br/>");
                            }
                            
                            if (div !== undefined) {                       
                                div.css({
                                    'width': '60%',
                                    'word-break': 'break-word',
                                    'padding': '1px 10px'
                                });
                               
                               // This formula was determined through experimentation
                                listSize = .9061*(div[0].offsetHeight + 50)+ 55.01;
                            }
                            div.remove();

                            return {
                                id,
                                additions,
                                deletions,
                                listSize,
                                disableAll: hasSpecificType(additions) || hasSpecificType(deletions)
                            }
                        });
                    });

                    function changeUserBranchesCreatedFrom(oldCreatedFromId, newCreatedFromId) {
                        _.forEach(dvm.os.listItem.branches, branch => {
                            if (cm.isUserBranch(branch)) {
                                var currentCreatedFromId = dvm.util.getPropertyId(branch, prefixes.catalog + 'createdFrom');
                                if (currentCreatedFromId === oldCreatedFromId) {
                                    dvm.util.replacePropertyId(branch, prefixes.catalog + 'createdFrom', dvm.util.getPropertyId(branch, prefixes.catalog + 'createdFrom'), newCreatedFromId);
                                    cm.updateRecordBranch(branch['@id'], dvm.os.listItem.ontologyRecord.recordId, catalogId, branch)
                                        .then(() => dvm.util.createSuccessToast('Updated referenced branch.'), dvm.util.createErrorToast);
                                }
                            }
                        });
                        dvm.os.listItem.upToDate = true;
                        dvm.os.listItem.userBranch = false;
                        dvm.os.listItem.createdFromExists = true;
                    }

                    function hasSpecificType(array) {
                        return !!_.intersection(_.map(_.filter(array, {p: typeIRI}), 'o'), types).length;
                    }
                }]
            }
        }
})();
