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
describe('Ontology State service', function() {
    var ontologyStateSvc, ontologyManagerSvc, updateRefsSvc, hierarchy, indexObject, expectedPaths, catalogManagerSvc, $q, scope, util, stateManagerSvc;
    var error = 'error';
    var inProgressCommit = {
        additions: ['test'],
        deletions: ['test']
    }
    var recordId = 'recordId';

    beforeEach(function() {
        module('ontologyState');
        mockOntologyManager();
        mockUpdateRefs();
        mockStateManager();
        mockUtil();
        mockCatalogManager();

        inject(function(ontologyStateService, _updateRefsService_, _ontologyManagerService_, _catalogManagerService_, _$q_, _$rootScope_, _utilService_, _stateManagerService_) {
            ontologyStateSvc = ontologyStateService;
            updateRefsSvc = _updateRefsService_;
            ontologyManagerSvc = _ontologyManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            $q = _$q_;
            scope = _$rootScope_;
            util = _utilService_;
            stateManagerSvc = _stateManagerService_;
        });

        ontologyStateSvc.listItem = {
            recordId: recordId,
            branchId: 'branchId',
            commitId: 'commitId'
        }
        ontologyStateSvc.selected = {'@id': 'id'};
        ontologyStateSvc.newState = {active: false};
        ontologyStateSvc.state = {
            tab: {
                active: true,
                entityIRI: 'entityIRI',
                usages: []
            },
            other: {active: false},
            recordId: recordId
        };

        /*
            node1a
                node2a
                    node3a
                    node3c
                node2b
                    node3a
                node2c
                    node3b
                        node3a
            node1b
                node3b
                    node3a
        */
        hierarchy = [{
            entityIRI: 'node1a',
            subEntities: [{
                entityIRI: 'node2a',
                subEntities: [{
                    entityIRI: 'node3a'
                },
                {
                    entityIRI: 'node3c'
                }]
            },
            {
                entityIRI: 'node2b',
                subEntities: [{
                    entityIRI: 'node3a'
                }]
            },
            {
                entityIRI: 'node2c',
                subEntities: [{
                    entityIRI: 'node3b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }]
            }]
        },
        {
            entityIRI: 'node1b',
            subEntities: [{
                entityIRI: 'node3b',
                subEntities: [{
                    entityIRI: 'node3a'
                }]
            }]
        }];
        indexObject = {
            'node2a': ['node1a'],
            'node2b': ['node1a'],
            'node2c': ['node1a'],
            'node3a': ['node2a', 'node2b', 'node3b'],
            'node3b': ['node2c', 'node1b'],
            'node3c': ['node2a']
        };
        expectedPaths = [
            ['node1a','node2a','node3a'],
            ['node1a','node2b','node3a'],
            ['node1a','node2c','node3b','node3a'],
            ['node1b','node3b','node3a']
        ];
    });

    it('reset should clear the correct variables', function() {
        ontologyStateSvc.states = ['test'];
        ontologyStateSvc.selected = {id: 'test'};
        ontologyStateSvc.state = {id: 'test', active: false};
        ontologyStateSvc.listItem = {id: 'test'};
        ontologyStateSvc.reset();
        expect(ontologyStateSvc.states).toEqual([]);
        expect(ontologyStateSvc.selected).toEqual({});
        expect(ontologyStateSvc.state).toEqual({active: true});
        expect(ontologyStateSvc.listItem).toEqual({});
    });

    describe('afterSave calls the correct functions', function() {
        var getDeferred;
        beforeEach(function() {
            getDeferred = $q.defer();
            catalogManagerSvc.getInProgressCommit.and.returnValue(getDeferred.promise);
        });
        describe('when getInProgressCommit resolves', function() {
            beforeEach(function() {
                getDeferred.resolve(inProgressCommit);
            });
            describe('and getOntologyStateByRecordId is empty', function() {
                var createDeferred;
                beforeEach(function() {
                    createDeferred = $q.defer();
                    stateManagerSvc.getOntologyStateByRecordId.and.returnValue({});
                    stateManagerSvc.createOntologyState.and.returnValue(createDeferred.promise);
                });
                it('and createOntologyState resolves', function() {
                    createDeferred.resolve(recordId);
                    ontologyStateSvc.afterSave()
                        .then(function(response) {
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, '');
                            expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(inProgressCommit);
                            expect(ontologyStateSvc.listItem.additions).toEqual([]);
                            expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                            expect(!_.has(ontologyStateSvc.state.tab, 'usages')).toBe(true);
                            expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId);
                            expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId);
                            expect(response).toEqual(recordId);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                });
                it('and createOntologyState rejects', function() {
                    createDeferred.reject(error);
                    ontologyStateSvc.afterSave()
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, '');
                            expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(inProgressCommit);
                            expect(ontologyStateSvc.listItem.additions).toEqual([]);
                            expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                            expect(!_.has(ontologyStateSvc.state.tab, 'usages')).toBe(true);
                            expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId);
                            expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId);
                            expect(response).toEqual(error);
                        });
                });
            });
            describe('and getOntologyStateByRecordId is present', function() {
                var updateDeferred;
                beforeEach(function() {
                    updateDeferred = $q.defer();
                    stateManagerSvc.getOntologyStateByRecordId.and.returnValue({id: 'id'});
                    stateManagerSvc.updateOntologyState.and.returnValue(updateDeferred.promise);
                });
                it('and createOntologyState resolves', function() {
                    updateDeferred.resolve(recordId);
                    ontologyStateSvc.afterSave()
                        .then(function(response) {
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, '');
                            expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(inProgressCommit);
                            expect(ontologyStateSvc.listItem.additions).toEqual([]);
                            expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                            expect(!_.has(ontologyStateSvc.state.tab, 'usages')).toBe(true);
                            expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId);
                            expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId);
                            expect(response).toEqual(recordId);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                });
                it('and createOntologyState rejects', function() {
                    updateDeferred.reject(error);
                    ontologyStateSvc.afterSave()
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, '');
                            expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(inProgressCommit);
                            expect(ontologyStateSvc.listItem.additions).toEqual([]);
                            expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                            expect(!_.has(ontologyStateSvc.state.tab, 'usages')).toBe(true);
                            expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId);
                            expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId);
                            expect(response).toEqual(error);
                        });
                });
            });
        });
        it('when getInProgressCommit rejects', function() {
            getDeferred.reject(error);
            ontologyStateSvc.afterSave()
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, '');
                    expect(response).toEqual(error);
                });
        });
    });

    it('clearInProgressCommit should clear the proper variables', function() {
        ontologyStateSvc.listItem = {
            inProgressCommit: {
                additions: ['addition'],
                deletions: ['deletion']
            }
        }
        ontologyStateSvc.clearInProgressCommit();
        expect(ontologyStateSvc.listItem.inProgressCommit.additions).toEqual([]);
        expect(ontologyStateSvc.listItem.inProgressCommit.deletions).toEqual([]);
    });

    it('setOpened sets the correct property on the state object', function() {
        var path = 'this.is.the.path';
        ontologyStateSvc.setOpened(path, true);
        expect(_.get(ontologyStateSvc.state, encodeURIComponent(path) + '.isOpened')).toBe(true);

        ontologyStateSvc.setOpened(path, false);
        expect(_.get(ontologyStateSvc.state, encodeURIComponent(path) + '.isOpened')).toBe(false);
    });

    describe('getOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            var path = 'this.is.the.path';
            expect(ontologyStateSvc.getOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            var path = 'this.is.the.path';
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.state, encodeURIComponent(path) + '.isOpened', value);
                expect(ontologyStateSvc.getOpened(path)).toBe(value);
            });
        });
    });

    it('setNoDomainsOpened sets the correct property on the state object', function() {
        var path = 'this.is.the.path';
        ontologyStateSvc.setNoDomainsOpened(path, true);
        expect(_.get(ontologyStateSvc.state, encodeURIComponent(path) + '.noDomainsOpened')).toBe(true);

        ontologyStateSvc.setNoDomainsOpened(path, false);
        expect(_.get(ontologyStateSvc.state, encodeURIComponent(path) + '.noDomainsOpened')).toBe(false);
    });

    describe('getNoDomainsOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            var path = 'this.is.the.path';
            expect(ontologyStateSvc.getNoDomainsOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            var path = 'this.is.the.path';
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.state, encodeURIComponent(path) + '.noDomainsOpened', value);
                expect(ontologyStateSvc.getNoDomainsOpened(path)).toBe(value);
            });
        });
    });

    it('setIndividualsOpened sets the correct property on the state object', function() {
        var path = 'this.is.the';
        var path2 = 'path';
        ontologyStateSvc.setIndividualsOpened(path, path2, true);
        expect(_.get(ontologyStateSvc.state, encodeURIComponent(path) + '.' + encodeURIComponent(path2) + '.individualsOpened')).toBe(true);

        ontologyStateSvc.setIndividualsOpened(path, path2, false);
        expect(_.get(ontologyStateSvc.state, encodeURIComponent(path) + '.' + encodeURIComponent(path2) + '.individualsOpened')).toBe(false);
    });

    describe('getIndividualsOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            var path = 'this.is.the';
            var path2 = 'path';
            expect(ontologyStateSvc.getIndividualsOpened(path, path2)).toBe(false);
        });
        it('when path is found', function() {
            var path = 'this.is.the';
            var path2 = 'path';
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.state, encodeURIComponent(path) + '.' + encodeURIComponent(path2) + '.individualsOpened', value);
                expect(ontologyStateSvc.getIndividualsOpened(path, path2)).toBe(value);
            });
        });
    });

    it('setDataPropertiesOpened sets the correct property on the state object', function() {
        var path = 'this.is.the.path';
        ontologyStateSvc.setDataPropertiesOpened(path, true);
        expect(_.get(ontologyStateSvc.state, encodeURIComponent(path) + '.dataPropertiesOpened')).toBe(true);

        ontologyStateSvc.setDataPropertiesOpened(path, false);
        expect(_.get(ontologyStateSvc.state, encodeURIComponent(path) + '.dataPropertiesOpened')).toBe(false);
    });

    describe('getDataPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            var path = 'this.is.the.path';
            expect(ontologyStateSvc.getDataPropertiesOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            var path = 'this.is.the.path';
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.state, encodeURIComponent(path) + '.dataPropertiesOpened', value);
                expect(ontologyStateSvc.getDataPropertiesOpened(path)).toBe(value);
            });
        });
    });

    it('setObjectPropertiesOpened sets the correct property on the state object', function() {
        var path = 'this.is.the.path';
        ontologyStateSvc.setObjectPropertiesOpened(path, true);
        expect(_.get(ontologyStateSvc.state, encodeURIComponent(path) + '.objectPropertiesOpened')).toBe(true);

        ontologyStateSvc.setObjectPropertiesOpened(path, false);
        expect(_.get(ontologyStateSvc.state, encodeURIComponent(path) + '.objectPropertiesOpened')).toBe(false);
    });

    describe('getObjectPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            var path = 'this.is.the.path';
            expect(ontologyStateSvc.getObjectPropertiesOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            var path = 'this.is.the.path';
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.state, encodeURIComponent(path) + '.objectPropertiesOpened', value);
                expect(ontologyStateSvc.getObjectPropertiesOpened(path)).toBe(value);
            });
        });
    });

    describe('onEdit calls the correct manager methods', function() {
        var iriBegin = 'begin';
        var iriThen = 'then';
        var iriEnd = 'end';
        var newIRI = iriBegin + iriThen + iriEnd;
        var getDeferred;
        beforeEach(function() {
            getDeferred = $q.defer();
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue({});
            ontologyManagerSvc.getEntityUsages.and.returnValue(getDeferred.promise);
            ontologyStateSvc.onEdit(iriBegin, iriThen, iriEnd);
        });
        it('regardless of getEntityUsages outcome', function() {
            expect(updateRefsSvc.update).toHaveBeenCalledWith(ontologyStateSvc.listItem, ontologyStateSvc.selected['@id'], newIRI);
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, angular.copy(ontologyStateSvc.selected));
            expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, angular.copy(ontologyStateSvc.selected));
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId, ontologyStateSvc.selected['@id'], 'construct');
        });
        it('when getEntityUsages resolves', function() {
            var statement = {'@id': 'test-id'};
            var response = [statement];
            getDeferred.resolve(response);
            scope.$apply();
            expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, statement);
            expect(updateRefsSvc.update).toHaveBeenCalledWith(response, ontologyStateSvc.selected['@id'], newIRI);
            expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, statement);
        });
        it('when getEntityUsages rejects', function() {
            getDeferred.reject();
            scope.$apply();
            expect(util.createErrorToast).toHaveBeenCalled();
        });
    });

    describe('setSelected should set the correct values and call the correct methods', function() {
        var object = {'@id': 'new'};
        var id = 'id';
        beforeEach(function() {
            ontologyStateSvc.selected = undefined;
            ontologyManagerSvc.getEntityByRecordId.and.returnValue(object);
            spyOn(ontologyStateSvc, 'setEntityUsages');
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue({});
        });
        it('when getUsages is true and getActivePage object does not have a usages property', function() {
            ontologyStateSvc.setSelected(id, true);
            expect(ontologyManagerSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, id);
            expect(ontologyStateSvc.selected).toEqual(object);
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).toHaveBeenCalledWith(id);
        });
        it('when getUsages is false', function() {
            ontologyStateSvc.setSelected(id, false);
            expect(ontologyManagerSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, id);
            expect(ontologyStateSvc.selected).toEqual(object);
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
        });
        it('when getEntityByRecordId returns undefined', function() {
            ontologyManagerSvc.getEntityByRecordId.and.returnValue(undefined);
            ontologyStateSvc.setSelected(id, true);
            expect(ontologyManagerSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, id);
            expect(ontologyStateSvc.selected).toEqual(undefined);
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
        });
        it('when getActivePage object does have a usages property', function() {
            ontologyStateSvc.getActivePage.and.returnValue({usages: []});
            ontologyStateSvc.setSelected(id, true);
            expect(ontologyManagerSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, id);
            expect(ontologyStateSvc.selected).toEqual(object);
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
        });
    });

    describe('setEntityUsages should call the correct function', function() {
        var getDeferred;
        var id = 'id';
        var activePage = {};
        beforeEach(function() {
            getDeferred = $q.defer();
            ontologyManagerSvc.getEntityUsages.and.returnValue(getDeferred.promise);
            ontologyStateSvc.setEntityUsages(id);
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(activePage);
        });
        it('when getEntityUsages resolves', function() {
            var response = [{'@id': 'id'}];
            getDeferred.resolve(response);
            scope.$apply();
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId, id);
            expect(activePage.usages).toEqual(response);
        });
        it('when getEntityUsages rejects', function() {
            getDeferred.reject('error');
            scope.$apply();
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId, id);
            expect(activePage.usages).toEqual([]);
        });
    });

    describe('addState sets the correct variables', function() {
        var recordId = 'recordId';
        var entityIRI = 'entityIRI';
        beforeEach(function() {
            ontologyStateSvc.states = [];
        });
        it('when the type is ontology', function() {
            ontologyStateSvc.addState(recordId, entityIRI, 'ontology');
            expect(ontologyStateSvc.states.length).toBe(1);
            expect(ontologyStateSvc.states[0]).toEqual({
                recordId: recordId,
                active: false,
                type: 'ontology',
                project: {
                    active: true,
                    entityIRI: entityIRI
                },
                overview: {
                    active: false
                },
                classes: {
                    active: false
                },
                properties: {
                    active: false
                },
                individuals: {
                    active: false
                },
                search: {
                    active: false
                }
            });
        });
        it('when the type is vocabulary', function() {
            ontologyStateSvc.addState(recordId, entityIRI, 'vocabulary');
            expect(ontologyStateSvc.states.length).toBe(1);
            expect(ontologyStateSvc.states[0]).toEqual({
                recordId: recordId,
                active: false,
                type: 'vocabulary',
                project: {
                    active: true,
                    entityIRI: entityIRI
                },
                concepts: {
                    active: false
                },
                search: {
                    active: false
                }
            });
        });
    });

    describe('setState sets the variables correctly', function() {
        it('when recordId is undefined', function() {
            ontologyStateSvc.setState(undefined);
            expect(ontologyStateSvc.state).toEqual(ontologyStateSvc.newState);
            expect(ontologyStateSvc.state.active).toBe(true);
            expect(ontologyStateSvc.newState.active).toBe(true);
        });
        it('when recordId is defined', function() {
            var listItem = {id: 'listId'};
            var state = {recordId: 'id'};
            ontologyStateSvc.states = [state];
            ontologyManagerSvc.getListItemByRecordId.and.returnValue(listItem);
            spyOn(ontologyStateSvc, 'setSelected');
            spyOn(ontologyStateSvc, 'getActiveEntityIRI').and.returnValue('id');
            ontologyStateSvc.setState('id', true);
            expect(ontologyStateSvc.state).toEqual(state);
            expect(ontologyStateSvc.listItem).toEqual(listItem);
            expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('id', true);
            expect(ontologyStateSvc.state.active).toBe(true);
        });
    });

    describe('getState returns the correct variable', function() {
        it('when recordId is undefined', function() {
            expect(ontologyStateSvc.getState(undefined)).toEqual(ontologyStateSvc.newState);
        });
        it('when recordId is defined', function() {
            var state = {recordId: 'id'};
            ontologyStateSvc.states = [state];
            expect(ontologyStateSvc.getState('id')).toEqual(state);
        });
    });

    describe('deleteState removes the state with the provided id from the states array', function() {
        it('if the recordId matches the current state', function() {
            ontologyStateSvc.deleteState(ontologyStateSvc.state.recordId);
            expect(ontologyStateSvc.state).toEqual(ontologyStateSvc.newState);
            expect(ontologyStateSvc.state.active).toBe(true);
            expect(ontologyStateSvc.newState.active).toBe(true);
            expect(ontologyStateSvc.selected).toBe(undefined);
        });
        it('if the recordId does not match the current state', function() {
            var state = {recordId: 'id'};
            ontologyStateSvc.states = [state];
            ontologyStateSvc.deleteState('id');
            expect(ontologyStateSvc.states.length).toBe(0);
        });
    });

    describe('resetStateTabs should set the correct variables', function() {
        beforeEach(function() {
            ontologyStateSvc.state = {
                classes: {entityIRI: 'id', usages: []},
                project: {entityIRI: 'id'}
            }
            ontologyStateSvc.selected = {};
        });
        it('when getActiveKey is not project', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('other');
            ontologyStateSvc.resetStateTabs();
            expect(ontologyStateSvc.state.classes).toEqual({});
            expect(ontologyStateSvc.state.project).toEqual({entityIRI: 'id'});
            expect(ontologyStateSvc.selected).toBe(undefined);
        });
        it('when getActiveKey is project', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('project');
            ontologyStateSvc.resetStateTabs();
            expect(ontologyStateSvc.state.classes).toEqual({});
            expect(ontologyStateSvc.state.project).toEqual({entityIRI: 'id'});
            expect(ontologyStateSvc.selected).toEqual({});
        });
    });

    describe('getActiveKey', function() {
        it('defaults to "project"', function() {
            ontologyStateSvc.state.tab.active = false;
            expect(ontologyStateSvc.getActiveKey()).toEqual('project');
        });
        it('returns the correct value', function() {
            expect(ontologyStateSvc.getActiveKey()).toEqual('tab');
        });
    });

    it('getActivePage gets the proper item', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('tab');
        expect(ontologyStateSvc.getActivePage()).toEqual(ontologyStateSvc.state.tab);
    });

    describe('setActivePage sets the correct variables', function() {
        it('when state has the key', function() {
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(ontologyStateSvc.state.tab);
            ontologyStateSvc.setActivePage('other');
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.state.tab.active).toBe(false);
            expect(ontologyStateSvc.state.other.active).toBe(true);
        });
        it('when state does not have the key', function() {
            spyOn(ontologyStateSvc, 'getActivePage');
            ontologyStateSvc.setActivePage('notThere');
            expect(ontologyStateSvc.getActivePage).not.toHaveBeenCalled();
            expect(ontologyStateSvc.state.tab.active).toBe(true);
            expect(ontologyStateSvc.state.other.active).toBe(false);
        });
    });

    it('getActiveEntityIRI should return the proper value', function() {
        spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(ontologyStateSvc.state.tab);
        expect(ontologyStateSvc.getActiveEntityIRI()).toEqual('entityIRI');

        ontologyStateSvc.getActivePage.and.returnValue(ontologyStateSvc.state.other);
        expect(ontologyStateSvc.getActiveEntityIRI()).toEqual(undefined);
    });

    describe('selectItem should call the proper functions', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(ontologyStateSvc.state.tab);
            spyOn(ontologyStateSvc, 'setEntityUsages');
            spyOn(ontologyStateSvc, 'setSelected');
        });
        it('when entityIRI is undefined', function() {
            ontologyStateSvc.selectItem(undefined);
            expect(ontologyStateSvc.getActivePage).not.toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
            expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith(undefined, false);
        });
        describe('when entityIRI is defined', function() {
            var newId = 'newId';
            it('and getUsages is true', function() {
                ontologyStateSvc.selectItem(newId, true);
                expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
                expect(ontologyStateSvc.state.tab.entityIRI).toEqual(newId);
                expect(ontologyStateSvc.setEntityUsages).toHaveBeenCalledWith(newId);
                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith(newId, false);
            });
            it('and getUsages is false', function() {
                ontologyStateSvc.selectItem(newId, false);
                expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
                expect(ontologyStateSvc.state.tab.entityIRI).toEqual(newId);
                expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith(newId, false);
            });
        });
    });

    it('unSelectItem sets all the variables appropriately', function() {
        spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(ontologyStateSvc.state.tab);
        ontologyStateSvc.unSelectItem();
        expect(ontologyStateSvc.selected).toBe(undefined);
        expect(!_.has(ontologyStateSvc.state.tab, 'entityIRI')).toBe(true);
        expect(!_.has(ontologyStateSvc.state.tab, 'usages')).toBe(true);
    });

    describe('hasChanges returns the proper value', function() {
        var recordId = 'recordId';
        it('when the listItem has additions', function() {
            ontologyManagerSvc.getListItemByRecordId.and.returnValue({additions: ['test']});
            expect(ontologyStateSvc.hasChanges(recordId)).toBe(true);
            expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
        it('when the listItem has deletions', function() {
            ontologyManagerSvc.getListItemByRecordId.and.returnValue({deletions: ['test']});
            expect(ontologyStateSvc.hasChanges(recordId)).toBe(true);
            expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
        it('when the listItem has neither additions nor deletions', function() {
            ontologyManagerSvc.getListItemByRecordId.and.returnValue({});
            expect(ontologyStateSvc.hasChanges(recordId)).toBe(false);
            expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
    });

    describe('isCommittable returns the proper value', function() {
        var recordId = 'recordId';
        it('when the listItem has additions', function() {
            ontologyManagerSvc.getListItemByRecordId.and.returnValue({inProgressCommit: {additions: ['test']}});
            expect(ontologyStateSvc.isCommittable(recordId)).toBe(true);
            expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
        it('when the listItem has deletions', function() {
            ontologyManagerSvc.getListItemByRecordId.and.returnValue({inProgressCommit: {deletions: ['test']}});
            expect(ontologyStateSvc.isCommittable(recordId)).toBe(true);
            expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
        it('when the listItem has neither additions nor deletions', function() {
            ontologyManagerSvc.getListItemByRecordId.and.returnValue({});
            expect(ontologyStateSvc.isCommittable(recordId)).toBe(false);
            expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
    });

    describe('addEntityToHierarchy', function() {
        describe('should add the entity to the single proper location in the tree', function() {
            it('where the parent entity has subEntities', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'new-node', indexObject, 'node1a');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    },
                    {
                        entityIRI: 'new-node'
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'new-node': ['node1a']
                });
            });
            it('where the parent does not have subEntities', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'new-node', indexObject, 'node3c');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'new-node': ['node3c']
                });
            });
        });
        describe('should add the entity to the multiple proper locations in the tree', function() {
            it('where the parent entity has subEntities', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'new-node', indexObject, 'node3b');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            },
                            {
                                entityIRI: 'new-node'
                            }]
                        }]
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'new-node'
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'new-node': ['node3b']
                });
            });
            it('where the parent does not have subEntities', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'new-node', indexObject, 'node3a');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a',
                                subEntities: [{
                                    entityIRI: 'new-node'
                                }]
                            }]
                        }]
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'new-node': ['node3a']
                });
            });
        });
        describe('should add the same hierarchy structure to the new area', function() {
            it('when not at the root level', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'node2b', indexObject, 'node1b');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a','node1b'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a']
                });
            });
            it('when at the root level', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'node1b', indexObject, 'node1a');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    },
                    {
                        entityIRI: 'node1b',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'node1b': ['node1a']
                });
            });
        });
    });

    describe('deleteEntityFromParentInHierarchy', function() {
        it('should remove the provided entityIRI from the parentIRI', function() {
            ontologyStateSvc.deleteEntityFromParentInHierarchy(hierarchy, 'node3a', 'node3b', indexObject);
            expect(hierarchy).toEqual([{
                entityIRI: 'node1a',
                subEntities: [{
                    entityIRI: 'node2a',
                    subEntities: [{
                        entityIRI: 'node3a'
                    },
                    {
                        entityIRI: 'node3c'
                    }]
                },
                {
                    entityIRI: 'node2b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                },
                {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b'
                    }]
                }]
            },
            {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b'
                }]
            }]);
            expect(indexObject).toEqual({
                'node2a': ['node1a'],
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3a': ['node2a', 'node2b'],
                'node3b': ['node2c', 'node1b'],
                'node3c': ['node2a']
            });
        });
        it('should add any subEntities that are unique to this location', function() {
            ontologyStateSvc.deleteEntityFromParentInHierarchy(hierarchy, 'node2a', 'node1a', indexObject);
            expect(hierarchy).toEqual([{
                entityIRI: 'node1a',
                subEntities: [{
                    entityIRI: 'node2b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                },
                {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]
            },
            {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }]
            },
            {
                entityIRI: 'node2a',
                subEntities: [{
                    entityIRI: 'node3a'
                },
                {
                    entityIRI: 'node3c'
                }]
            }]);
            expect(indexObject).toEqual({
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3a': ['node2a', 'node2b', 'node3b'],
                'node3b': ['node2c', 'node1b'],
                'node3c': ['node2a']
            });
        });
    });

    describe('deleteEntityFromHierarchy', function() {
        it('should delete the entity from the hierarchy tree', function() {
            ontologyStateSvc.deleteEntityFromHierarchy(hierarchy, 'node3a', indexObject);
            expect(hierarchy).toEqual([{
                entityIRI: 'node1a',
                subEntities: [{
                    entityIRI: 'node2a',
                    subEntities: [{
                        entityIRI: 'node3c'
                    }]
                },
                {
                    entityIRI: 'node2b'
                },
                {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b'
                    }]
                }]
            },
            {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b'
                }]
            }]);
            expect(indexObject).toEqual({
                'node2a': ['node1a'],
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3b': ['node2c', 'node1b'],
                'node3c': ['node2a']
            });
        });
        /*it('should move the subEntities if required', function() {
            ontologyStateSvc.deleteEntityFromHierarchy(hierarchy, 'node2a', indexObject);
            expect(hierarchy).toEqual([{
                entityIRI: 'node1a',
                subEntities: [{
                    entityIRI: 'node2b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                },
                {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                },
                {
                    entityIRI: 'node3c'
                }]
            }]);
            expect(updateRefsSvc.remove).toHaveBeenCalledWith(indexObject, 'node2a');
            expect(indexObject).toEqual({
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3a': ['node2a', 'node2b', 'node3b'],
                'node3b': ['node2c'],
                'node3c': ['node2a']
            });
        });*/
    });

    describe('getPathsTo', function() {
        it('should return all paths to provided node', function() {
            var result = ontologyStateSvc.getPathsTo(indexObject, 'node3a');
            expect(result.length).toBe(4);
            expect(_.sortBy(result)).toEqual(_.sortBy(expectedPaths));
        });
    });

    describe('goTo calls the proper manager functions with correct parameters', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue({entityIRI: ''});
            spyOn(ontologyStateSvc, 'setActivePage');
            spyOn(ontologyStateSvc, 'selectItem');
            spyOn(ontologyStateSvc, 'getPathsTo');
            spyOn(ontologyStateSvc, 'openAt');
            ontologyStateSvc.listItem = {
                classIndex: 'classIndex',
                conceptIndex: 'conceptIndex',
                dataPropertyIndex: 'dataPropertyIndex',
                objectPropertyIndex: 'objectPropertyIndex'
            }
        });
        it('when it is a vocabulary', function() {
            ontologyStateSvc.state = {type: 'vocabulary'};
            ontologyStateSvc.goTo('iri');
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('concepts');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
            expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptIndex, 'iri');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.getPathsTo(ontologyStateSvc.listItem.conceptIndex, 'iri'));
        });
        describe('when it is not a vocabulary', function() {
            beforeEach(function() {
                ontologyStateSvc.state = {type: 'ontology'};
            });
            it('and is a class', function() {
                ontologyManagerSvc.isClass.and.returnValue(true);
                ontologyStateSvc.goTo('iri');
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('classes');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith(ontologyStateSvc.listItem.classIndex, 'iri');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.getPathsTo(ontologyStateSvc.listItem.classIndex, 'iri'));
            });
            it('and is a datatype property', function() {
                ontologyManagerSvc.isClass.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                spyOn(ontologyStateSvc, 'setDataPropertiesOpened');
                ontologyStateSvc.goTo('iri');
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataPropertyIndex, 'iri');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.getPathsTo(ontologyStateSvc.listItem.dataPropertyIndex, 'iri'));
                expect(ontologyStateSvc.setDataPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, true);
            });
            it('and is an object property', function() {
                ontologyManagerSvc.isClass.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                spyOn(ontologyStateSvc, 'setObjectPropertiesOpened');
                ontologyStateSvc.goTo('iri');
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectPropertyIndex, 'iri');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.getPathsTo(ontologyStateSvc.listItem.objectPropertyIndex, 'iri'));
                expect(ontologyStateSvc.setObjectPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, true);
            });
            it('and is an individual', function() {
                ontologyManagerSvc.isClass.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                ontologyManagerSvc.isIndividual.and.returnValue(true);
                ontologyStateSvc.goTo('iri');
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('individuals');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.getPathsTo).not.toHaveBeenCalled();
                expect(ontologyStateSvc.openAt).not.toHaveBeenCalled();
            });
        });
    });

    describe('openAt', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem = {recordId: 'id'};
        });
        it('if already opened, does not set anything', function() {
            var pathsArray = [['path', 'one', 'here'], ['path', 'two', 'here']];
            ontologyStateSvc.state[ontologyStateSvc.listItem.recordId] = {
                isOpened: true,
                path: {
                    isOpened: true,
                    two: {
                        isOpened: true
                    }
                }
            };
            ontologyStateSvc.openAt(pathsArray);
            expect(_.get(ontologyStateSvc.state, encodeURIComponent(ontologyStateSvc.listItem.recordId) + '.'
                + encodeURIComponent(_.join(_.slice(pathsArray[0], 0, pathsArray[0].length - 1), '.')) + '.isOpened'))
                .toBe(undefined);
        });
        it('if the whole path to it is not opened, sets the first path provided open', function() {
            var pathsArray = [['path', 'one', 'here'], ['path', 'two', 'here']];
            ontologyStateSvc.state[ontologyStateSvc.listItem.recordId] = {
                isOpened: true,
                path: {
                    isOpened: false,
                    two: {
                        isOpened: true
                    }
                }
            };
            ontologyStateSvc.openAt(pathsArray);
            expect(_.get(ontologyStateSvc.state, encodeURIComponent(ontologyStateSvc.listItem.recordId) + '.'
                + encodeURIComponent(_.join(_.slice(pathsArray[0], 0, pathsArray[0].length - 1), '.')) + '.isOpened'))
                .toBe(true);
        });
        it('if not already opened, sets the first path provided open', function() {
            var pathsArray = [['path', 'one', 'here'], ['path', 'two', 'here']];
            delete ontologyStateSvc.state[ontologyStateSvc.listItem.recordId];
            ontologyStateSvc.openAt(pathsArray);
            expect(_.get(ontologyStateSvc.state, encodeURIComponent(ontologyStateSvc.listItem.recordId) + '.'
                + encodeURIComponent(_.join(_.slice(pathsArray[0], 0, pathsArray[0].length - 1), '.')) + '.isOpened'))
                .toBe(true);
        });
    });
});