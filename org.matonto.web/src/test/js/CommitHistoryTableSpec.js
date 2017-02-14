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
    var $compile, scope, $q, element, controller, $filter, catalogManagerSvc, getDeferred, catalogId;
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
        mockUtil();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _$filter_, _$q_, _catalogManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $filter = _$filter_;
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
        it('condenseId returns the proper string', function() {
            expect(controller.condenseId(id)).toEqual($filter('splitIRI')(id).end.substr(0,10));
        });
        describe('getCreatorDisplay should return the correct value', function() {
            it('when there is a first and last', function() {
                var creatorObject = {
                    first: 'first',
                    last: 'last'
                }
                expect(controller.getCreatorDisplay(creatorObject)).toEqual('first last');
            });
            it('when there is not a first or last but there is a username', function() {
                var creatorObject = {
                    username: 'username'
                }
                expect(controller.getCreatorDisplay(creatorObject)).toEqual('username');
            });
            it('when there is not a first, last, or username', function() {
                expect(controller.getCreatorDisplay({})).toEqual('[Not Available]');
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
