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
describe('Commit History Table directive', function() {
    var $compile, scope, $q, element, controller, isolatedScope, catalogManagerSvc, getDeferred, catalogId;
    var error = 'error';
    var id = 'id';
    var commitId = 'commitId';
    var branch = {'@id': 'branchId'};
    var recordId = 'recordId';
    var commits = [{id: commitId}];
    var paperMock = {
        clear: jasmine.createSpy('clear'),
        selectAll: jasmine.createSpy('selectAll').and.returnValue([])
    };

    beforeEach(function() {
        module('templates');
        module('commitHistoryTable');
        injectChromaConstant();
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
        isolatedScope = element.isolateScope();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('commit-history-table')).toBe(true);
            expect(element.querySelectorAll('.wrapper').length).toBe(1);
        });
        _.forEach(['table', 'thead', 'tbody', 'svg'], function(item) {
            it('with a ' + item, function() {
                expect(element.find(item).length).toBe(1);
            });
        });
        it('with ths', function() {
            expect(element.find('th').length).toBe(4);
        });
        it('with the correct styles based on whether a graph should be shown', function() {
            var svg = element.find('svg');
            expect(svg.css('height')).toBe('0px');
            expect(svg.css('width')).toBe('0px');

            isolatedScope.graph = true;
            scope.$digest();
            expect(svg.css('height')).toBe((controller.commits.length * controller.circleSpacing + controller.deltaY) + 'px');
            expect(svg.css('width')).not.toBe('0px');
        });
        it('depending on whether there is a error', function() {
            expect(element.find('error-display').length).toBe(0);
            controller.error = error;
            scope.$apply();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on whether the commit overlay should be shown', function() {
            expect(element.find('commit-info-overlay').length).toBe(0);

            controller.showOverlay = true;
            scope.$digest();
            expect(element.find('commit-info-overlay').length).toBe(1);
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
            it('unless a branch has not been passed', function() {
                catalogManagerSvc.getBranchCommits.calls.reset();
                scope.branch = undefined;
                scope.$digest();
                controller.getCommits();
                expect(catalogManagerSvc.getBranchCommits).not.toHaveBeenCalled();
                expect(controller.commits).toEqual([]);
            });
            describe('if a branch has been passed', function() {
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
        });
        it('should reset graph variables', function() {
            controller.reset();
            expect(Snap).toHaveBeenCalled();
            expect(controller.deltaX).toBe(10);
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
    it('should call openCommitOverlay when an id is clicked', function() {
        scope.$apply();
        controller.commits = commits;
        scope.$digest();
        spyOn(controller, 'openCommitOverlay');
        var id = angular.element(element.querySelectorAll('table tr td.commit-id a')[0]);
        id.triggerHandler('click');
        expect(controller.openCommitOverlay).toHaveBeenCalledWith(commits[0].id);
    });
});
