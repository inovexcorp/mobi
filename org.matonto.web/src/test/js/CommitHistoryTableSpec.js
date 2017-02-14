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
    var $compile, scope, $q, element, controller, catalogManagerSvc, getDeferred, catalogId, isolatedScope;
    var error = 'error';
    var id = 'id';
    var commitId = 'commitId';
    var branchId = 'branchId';
    var recordId = 'recordId';
    var commits = [{'@id': commitId}];

    beforeEach(function() {
        module('templates');
        module('commitHistoryTable');
        mockOntologyState();
        mockCatalogManager();
        mockUserManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
        });
        catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        getDeferred = $q.defer();
        catalogManagerSvc.getBranchCommits.and.returnValue(getDeferred.promise);

        scope.recordId = recordId;
        scope.branchId = branchId;
        scope.commitId = commitId;
        element = $compile(angular.element('<commit-history-table commit-id="commitId" branch-id="branchId" record-id="recordId"></commit-history-table>'))(scope);
        scope.$digest();
        controller = element.controller('commitHistoryTable');
        scope.dvm = controller;
        isolatedScope = element.isolateScope();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('commit-history-table')).toBe(true);
        });
        _.forEach(['table', 'thead', 'tbody'], function(item) {
            it('for ' + item, function() {
                expect(element.find(item).length).toBe(1);
            });
        });
        it('for error-display', function() {
            expect(element.find('error-display').length).toBe(0);
            controller.error = error;
            scope.$apply();
            expect(element.find('error-display').length).toBe(1);
        });
        it('for th', function() {
            expect(element.find('th').length).toBe(4);
        });
    });

    describe('in isolated scope', function() {
        it('recordId should be one way bound', function() {
            isolatedScope.recordId = 'new';
            scope.$digest();
            expect(scope.recordId).toEqual(recordId);
        });
        it('branchId should be one way bound', function() {
            isolatedScope.branchId = 'new';
            scope.$digest();
            expect(scope.branchId).toEqual(branchId);
        });
        it('commitId should be one way bound', function() {
            isolatedScope.commitId = 'new';
            scope.$digest();
            expect(scope.commitId).toEqual(commitId);
        });
    });

    describe('controller methods', function() {
        describe('getBranchCommits should be called initially', function() {
            it('and if it succeeds', function() {
                getDeferred.resolve(commits);
                scope.$apply();
                expect(catalogManagerSvc.getBranchCommits).toHaveBeenCalledWith(scope.branchId, scope.recordId, catalogId);
                expect(controller.error).toEqual('');
                expect(controller.commits).toEqual(commits);
            });
            it('and if it fails', function() {
                getDeferred.reject(error);
                scope.$apply();
                expect(catalogManagerSvc.getBranchCommits).toHaveBeenCalledWith(scope.branchId, scope.recordId, catalogId);
                expect(controller.error).toEqual(error);
                expect(controller.commits).toEqual([]);
            });
        });
        describe('$scope.$watch triggers when changing the', function() {
            it('commitId', function() {
                scope.$apply('commitId = "new"');
                expect(catalogManagerSvc.getBranchCommits).toHaveBeenCalledWith(scope.branchId, scope.recordId, catalogId);
            });
            it('branchId', function() {
                scope.$apply('branchId = "new"');
                expect(catalogManagerSvc.getBranchCommits).toHaveBeenCalledWith('new', scope.recordId, catalogId);
            });
            it('recordId', function() {
                scope.$apply('recordId = "new"');
                expect(catalogManagerSvc.getBranchCommits).toHaveBeenCalledWith(scope.branchId, 'new', catalogId);
            });
        });
    });
});
