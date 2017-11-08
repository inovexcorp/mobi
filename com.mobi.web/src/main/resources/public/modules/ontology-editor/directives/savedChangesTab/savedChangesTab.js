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

        savedChangesTab.$inject = ['$q', 'ontologyStateService', 'utilService', 'catalogManagerService', 'prefixes'];

        function savedChangesTab($q, ontologyStateService, utilService, catalogManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/savedChangesTab/savedChangesTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
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

                    dvm.removeChanges = function() {
                        cm.deleteInProgressCommit(dvm.os.listItem.ontologyRecord.recordId, catalogId)
                            .then(() => dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, dvm.os.listItem.upToDate), $q.reject)
                            .then(() => dvm.os.clearInProgressCommit(), errorMessage => dvm.error = errorMessage);
                    }

                    /*dvm.setChecked = function(value) {
                        _.forEach(dvm.list, item => {
                            _.forEach(['additions', 'deletions'], attr => {
                                _.forEach(_.get(item, attr, []), statement => {
                                    statement.checked = value;
                                    if (!value) {
                                        statement.disabled = value;
                                    } else if (item.disableAll && statement.p !== typeIRI && !_.includes(types, statement.o)) {
                                        statement.disabled = true;
                                    }
                                });
                            });
                        });
                    }

                    dvm.onAdditionCheck = function(subject, predicate, object, isChecked) {
                        if (predicate === typeIRI && _.includes(types, object)) {
                            var item = _.find(dvm.list, {id: subject});
                            _.forEach(_.get(item, 'additions', []), statement => {
                                if (statement.p !== predicate && statement.o !== object) {
                                    statement.checked = isChecked;
                                    statement.disabled = isChecked;
                                }
                            });
                        }
                    }

                    dvm.onDeletionCheck = function(subject, predicate, object, isChecked) {
                        if (predicate !== typeIRI || (predicate === typeIRI && !_.includes(types, object))) {
                            var typeStatement;
                            var shouldBeDisabled = false;
                            var item = _.find(dvm.list, {id: subject});
                            _.forEach(_.get(item, 'deletions', []), statement => {
                                if (statement.p === typeIRI && _.includes(types, statement.o)) {
                                    if (isChecked) {
                                        statement.checked = true;
                                    }
                                    statement.disabled = isChecked;
                                }
                            });
                        }
                    }

                    dvm.removeChecked = function() {
                        var differenceObj = {
                            additions: [],
                            deletions: []
                        };
                        _.forEach(dvm.list, item => {
                            _.forEach(_.filter(item.additions, {checked: true}), addition => {
                                var predicate = addition.p === typeIRI ? '@type' : addition.p;
                                differenceObj.deletions.push(dvm.util.createJson(item.id, predicate, addition.o));
                            });
                            _.forEach(_.filter(item.deletions, {checked: true}), deletion => {
                                var predicate = deletion.p === typeIRI ? '@type' : deletion.p;
                                differenceObj.additions.push(dvm.util.createJson(item.id, predicate, deletion.o));
                            });
                        });
                        dvm.os.saveChanges(dvm.os.listItem.ontologyRecord.recordId, differenceObj)
                            .then(() => dvm.os.afterSave(), $q.reject)
                            .then(() => dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.listItem.ontologyRecord.commitId, dvm.os.listItem.ontologyStatus.upToDate, dvm.os.listItem.inProgressCommit), $q.reject)
                            .then(() => dvm.util.createSuccessToast('Checked changes removed'), dvm.util.createErrorToast);
                    }

                    dvm.getTotalChecked = function() {
                        var count = 0;
                        _.forEach(dvm.list, item => {
                            count += _.filter(item.additions, {checked: true}).length;
                            count += _.filter(item.deletions, {checked: true}).length;
                        });
                        return count;
                    }*/

                    dvm.orderByIRI = function(item) {
                        return dvm.util.getBeautifulIRI(item.id);
                    }

                    $scope.$watchGroup(['dvm.os.listItem.inProgressCommit.additions', 'dvm.os.listItem.inProgressCommit.deletions'], () => {
                        var ids = _.unionWith(_.map(dvm.os.listItem.inProgressCommit.additions, '@id'), _.map(dvm.os.listItem.inProgressCommit.deletions, '@id'), _.isEqual);
                        dvm.list = _.map(ids, id => {
                            var additions = dvm.util.getChangesById(id, dvm.os.listItem.inProgressCommit.additions);
                            var deletions = dvm.util.getChangesById(id, dvm.os.listItem.inProgressCommit.deletions);
                            return {
                                id,
                                additions,
                                deletions,
                                disableAll: hasSpecificType(additions) || hasSpecificType(deletions)
                            }
                        });
                    });

                    function hasSpecificType(array) {
                        return !!_.intersection(_.map(_.filter(array, {p: typeIRI}), 'o'), types).length;
                    }
                }]
            }
        }
})();
