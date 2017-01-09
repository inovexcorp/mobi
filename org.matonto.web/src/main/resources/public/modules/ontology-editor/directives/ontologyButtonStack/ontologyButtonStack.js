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
        .module('ontologyButtonStack', [])
        .directive('ontologyButtonStack', ontologyButtonStack);

        ontologyButtonStack.$inject = ['$filter', 'ontologyStateService', 'ontologyManagerService',
            'catalogManagerService', 'utilService', 'updateRefsService'];

        function ontologyButtonStack($filter, ontologyStateService, ontologyManagerService, catalogManagerService,
            utilService, updateRefsService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyButtonStack/ontologyButtonStack.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var cm = catalogManagerService;
                    var util = utilService;
                    var update = updateRefsService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.os = ontologyStateService;
                    dvm.showDeleteOverlay = false;
                    dvm.error = '';

                    dvm.delete = function() {
                        cm.deleteInProgressCommit(dvm.os.listItem.recordId, catalogId)
                            .then(() => {
                                var ontology = om.getOntologyByRecordId(dvm.os.listItem.recordId);
                                _.forEach(dvm.os.listItem.inProgressCommit.additions, statements => {
                                    var entityIRI = statements['@id'];
                                    var entity = om.getEntity(ontology, entityIRI);
                                    if (_.isEqual(statements, $filter('removeMatonto')(entity))) {
                                        om.removeEntity(ontology, entityIRI)
                                    } else {
                                        _.unset(statements, '@id');
                                        _.forOwn(statements, (value, key) => update.remove(entity[key], value));
                                    }
                                });
                                _.forEach(dvm.os.listItem.inProgressCommit.deletions, statements => {
                                    var entity = om.getEntity(ontology, statements['@id']);
                                    if (_.isEmpty(entity)) {
                                        om.addEntity(ontology, statements);
                                    } else {
                                        _.mergeWith(entity, statements, util.mergingArrays);
                                    }
                                });
                                /*om.getOntology(dvm.os.listItem.ontologyId, dvm.os.listItem.recordId)
                                    .then(response => {
                                        dvm.os.state.ontology = response.ontology;
                                        dvm.showDeleteOverlay = false;
                                    }, errorMessage => dvm.error = errorMessage);*/
                                dvm.os.clearInProgressCommit();
                                dvm.showDeleteOverlay = false;
                            }, errorMessage => dvm.error = errorMessage);
                    }
                }
            }
        }
})();
