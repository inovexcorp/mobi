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
describe('Commit History Table directive', function() {
    var $compile, scope, $q, element, controller, isolatedScope, catalogManagerSvc, getDeferred, catalogId;
    var error = 'error';
    var id = 'id';
    var commitId = 'commitId';
    var branch = {'@id': 'branchId'};
    var recordId = 'recordId';
    var commits = [{'@id': commitId}];
    var paperMock = {
        clear: jasmine.createSpy('clear')
    };

    beforeEach(function() {
        module('templates');
        module('commitHistoryTable');
        mockOntologyState();
        mockCatalogManager();
        mockUserManager();
        mockUtil();

        module(function($provide) {
            $provide.constant('Snap', jasmine.createSpy('Snap').and.returnValue(paperMock));
        });

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _Snap_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            Snap = _Snap_;
        });
        catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        getDeferred = $q.defer();

        scope.recordId = recordId;
        scope.branch = branch;
        scope.commitId = commitId;
        element = $compile(angular.element('<commit-history-table commit-id="commitId" branch="branch" record-id="recordId"></commit-history-table>'))(scope);
        scope.$digest();
        controller = element.controller('commitHistoryTable');
        // scope.dvm = controller;
        isolatedScope = element.isolateScope();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('commit-history-table')).toBe(true);
            expect(element.querySelectorAll('.wrapper').length).toBe(1);
            expect(element.querySelectorAll('.table-wrapper').length).toBe(1);
        });
        _.forEach(['table', 'thead', 'tbody', 'svg'], function(item) {
            it('with a ' + item, function() {
                expect(element.find(item).length).toBe(1);
            });
        });
        it('with ths', function() {
            expect(element.find('th').length).toBe(4);
        });
        it('depending on whether there is a error', function() {
            expect(element.find('error-display').length).toBe(0);
            controller.error = error;
            scope.$apply();
            expect(element.find('error-display').length).toBe(1);
        });
    });
    describe('controller bound variable', function() {
        it('recordId should be one way bound', function() {
            controller.recordId = 'new';
            scope.$digest();
            expect(scope.recordId).toEqual(recordId);
        });
        it('branch should be one way bound', function() {
            controller.branch = {};
            scope.$digest();
            expect(scope.branch).toEqual(branch);
        });
        it('commitId should be one way bound', function() {
            controller.commitId = 'new';
            scope.$digest();
            expect(scope.commitId).toEqual(commitId);
        });
    });
    describe('controller methods', function() {
        describe('should get the list of commits for a branch', function() {
            beforeEach(function() {
                catalogManagerSvc.getBranchCommits.and.returnValue(getDeferred.promise);
                spyOn(controller, 'drawGraph');
                spyOn(controller, 'reset');
            });
            describe('successfully', function() {
                beforeEach(function() {
                    getDeferred.resolve(commits);
                });
                it('drawing the graph', function() {
                    isolatedScope.graph = true;
                    controller.getCommits();
                    scope.$apply();
                    expect(catalogManagerSvc.getBranchCommits).toHaveBeenCalledWith(scope.branch['@id'], scope.recordId, catalogId);
                    expect(controller.error).toEqual('');
                    expect(controller.commits).toEqual(commits);
                    expect(controller.drawGraph).toHaveBeenCalled();
                });
                it('without drawing a graph', function() {
                    isolatedScope.graph = false;
                    controller.getCommits();
                    scope.$apply();
                    expect(catalogManagerSvc.getBranchCommits).toHaveBeenCalledWith(scope.branch['@id'], scope.recordId, catalogId);
                    expect(controller.error).toEqual('');
                    expect(controller.commits).toEqual(commits);
                    expect(controller.drawGraph).not.toHaveBeenCalled();
                });
            });
            describe('unless an error occurs', function() {
                beforeEach(function() {
                    getDeferred.reject(error);
                });
                it('with a graph', function() {
                    isolatedScope.graph = true;
                    controller.getCommits();
                    scope.$apply();
                    expect(catalogManagerSvc.getBranchCommits).toHaveBeenCalledWith(scope.branch['@id'], scope.recordId, catalogId);
                    expect(controller.error).toEqual(error);
                    expect(controller.commits).toEqual([]);
                    expect(controller.reset).toHaveBeenCalled();
                });
                it('with no graph', function() {
                    isolatedScope.graph = false;
                    controller.getCommits();
                    scope.$apply();
                    expect(catalogManagerSvc.getBranchCommits).toHaveBeenCalledWith(scope.branch['@id'], scope.recordId, catalogId);
                    expect(controller.error).toEqual(error);
                    expect(controller.commits).toEqual([]);
                    expect(controller.reset).not.toHaveBeenCalled();
                });
            });
        });
        it('should reset graph variables', function() {
            controller.reset();
            expect(paperMock.clear).toHaveBeenCalled();
            expect(controller.deltaX).toBe(85);
        });
    });
    describe('$scope.$watch triggers when changing the', function() {
        beforeEach(function() {
            spyOn(controller, 'getCommits');
        });
        it('commitId', function() {
            scope.$apply('commitId = "new"');
            expect(controller.getCommits).toHaveBeenCalled();
        });
        it('branch', function() {
            scope.$apply('branch = {"@id": "new"}');
            expect(controller.getCommits).toHaveBeenCalled();
        });
        it('recordId', function() {
            scope.$apply('recordId = "new"');
            expect(controller.getCommits).toHaveBeenCalled();
        });
    });
});
