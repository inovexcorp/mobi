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
describe('Commit Compiled Resource directive', function() {
    var $compile, scope, $q, catalogManagerSvc, Snap, modalSvc;

    beforeEach(function() {
        module('templates');
        module('commitCompiledResource');
        injectChromaConstant();
        mockOntologyState();
        mockCatalogManager();
        mockUserManager();
        mockUtil();
        mockModal();
        mockHttpService();

        module(function($provide) {
            $provide.constant('Snap', jasmine.createSpy('Snap').and.returnValue({
                clear: jasmine.createSpy('clear'),
                selectAll: jasmine.createSpy('selectAll').and.returnValue([])
            }));
        });

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _Snap_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            Snap = _Snap_;
            modalSvc = _modalService_;
        });

        this.error = 'error';
        this.commitId = 'commit';
        this.commits = [{id: this.commitId}];

        scope.commitId = 'commit';
        scope.entityId = 'entity';
        scope.commitData = [];
        this.element = $compile(angular.element('<commit-compiled-resource commit-id="commitId" entity-id="entityId" commit-data="commitData"></commit-compiled-resource>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('commitCompiledResource');
        this.isolatedScope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        Snap = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.controller.commits = this.commits;
            scope.$apply();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('commit-compiled-resource')).toBe(true);
            expect(this.element.querySelectorAll('.wrapper').length).toBe(1);
        });
        _.forEach(['table', 'thead', 'tbody', 'svg'], function(item) {
            it('with a ' + item, function() {
                expect(this.element.find(item).length).toBe(1);
            });
        });
        it('with ths', function() {
            expect(this.element.find('th').length).toBe(4);
        });
        it('with the correct styles based on whether a graph should be shown', function() {
            var svg = this.element.find('svg');
            expect(svg.css('height')).toBe('0px');
            expect(svg.css('width')).toBe('0px');

            this.isolatedScope.graph = true;
            scope.$digest();
            expect(svg.css('height')).toBe((this.controller.commits.length * this.controller.circleSpacing + this.controller.deltaY) + 'px');
            expect(svg.css('width')).not.toBe('0px');
        });
        it('depending on whether there is a error', function() {
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.error = this.error;
            scope.$apply();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on whether there are commits', function() {
            expect(this.element.find('info-message').length).toBe(0);
            this.controller.commits = [];
            scope.$apply();
            expect(this.element.find('info-message').length).toBe(1);
        });
    });
    describe('controller bound variable', function() {
        it('headTitle should be one way bound', function() {
            var original = scope.headTitle;
            this.controller.headTitle = '';
            scope.$digest();
            expect(scope.headTitle).toEqual(original);
        });
        it('commitId should be one way bound', function() {
            var original = scope.commitId;
            this.controller.commitId = 'new';
            scope.$digest();
            expect(scope.commitId).toEqual(original);
        });
        it('targetId should be one way bound', function() {
            var original = scope.targetId;
            this.controller.targetId = 'new';
            scope.$digest();
            expect(scope.targetId).toEqual(original);
        });
        it('commitData should be two way bound', function() {
            this.controller.commitData = [{}];
            scope.$digest();
            expect(scope.commitData).toEqual([{}]);
        });
    });
    describe('controller methods', function() {
        describe('should open the commitInfoOverlay', function() {
            beforeEach(function() {
                this.controller.commits = this.commits;
            });
            it('if getCommit resolves', function() {
                catalogManagerSvc.getCommit.and.returnValue($q.when({additions: [], deletions: []}));
                this.controller.openCommitOverlay(this.commitId);
                scope.$apply();
                expect(catalogManagerSvc.getCommit).toHaveBeenCalledWith(this.commitId);
                expect(modalSvc.openModal).toHaveBeenCalledWith('commitInfoOverlay', {commit: {id: this.commitId}, additions: [], deletions: []}, undefined, 'lg');
            });
            it('unless getCommit rejects', function() {
                catalogManagerSvc.getCommit.and.returnValue($q.reject('Error Message'));
                this.controller.openCommitOverlay(this.commitId);
                scope.$apply();
                expect(catalogManagerSvc.getCommit).toHaveBeenCalledWith(this.commitId);
                expect(modalSvc.openModal).not.toHaveBeenCalled();
                expect(this.controller.error).toEqual('Error Message');
            });
        });
        describe('should get the list of commits', function() {
            beforeEach(function() {
                spyOn(this.controller, 'drawGraph');
                spyOn(this.controller, 'reset');
            });
            it('unless a commit has not been passed', function() {
                catalogManagerSvc.getCommit.calls.reset();
                scope.commitId = undefined;
                scope.$digest();
                this.controller.getCommits();
                expect(catalogManagerSvc.getCommit).not.toHaveBeenCalled();
                expect(this.controller.commits).toEqual([]);
            });
            describe('if a commit has been passed', function() {
                describe('successfully', function() {
                    describe('for a specific commit id', function() {
                        beforeEach(function() {
                            catalogManagerSvc.getCommitHistory.and.returnValue($q.when(this.commits));
                        });
                        it('drawing the graph', function() {
                            this.isolatedScope.graph = true;
                            this.controller.getCommits();
                            scope.targetId = undefined;
                            scope.$apply();
                            expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, this.controller.id);
                            expect(this.controller.error).toEqual('');
                            expect(this.controller.commits).toEqual(this.commits);
                            expect(this.controller.drawGraph).toHaveBeenCalled();
                        });
                        it('without drawing a graph', function() {
                            this.isolatedScope.graph = false;
                            this.controller.getCommits();
                            scope.targetId = undefined;
                            scope.$apply();
                            expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, this.controller.id);
                            expect(this.controller.error).toEqual('');
                            expect(this.controller.commits).toEqual(this.commits);
                            expect(this.controller.drawGraph).not.toHaveBeenCalled();
                        });
                    });
                    describe('for a difference between commits', function() {
                        beforeEach(function() {
                            catalogManagerSvc.getCommitHistory.and.returnValue($q.when(this.commits));
                        });
                        it('drawing the graph', function() {
                            this.isolatedScope.graph = true;
                            this.controller.getCommits();
                            scope.$apply();
                            expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(scope.commitId, scope.targetId, this.controller.id);
                            expect(this.controller.error).toEqual('');
                            expect(this.controller.commits).toEqual(this.commits);
                            expect(this.controller.drawGraph).toHaveBeenCalled();
                        });
                        it('without drawing a graph', function() {
                            this.isolatedScope.graph = false;
                            this.controller.getCommits();
                            scope.$apply();
                            expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(scope.commitId, scope.targetId, this.controller.id);
                            expect(this.controller.error).toEqual('');
                            expect(this.controller.commits).toEqual(this.commits);
                            expect(this.controller.drawGraph).not.toHaveBeenCalled();
                        });
                    });
                });
                describe('unless an error occurs', function() {
                    beforeEach(function() {
                        catalogManagerSvc.getCommitHistory.and.returnValue($q.reject(this.error));
                    });
                    it('with a graph', function() {
                        this.isolatedScope.graph = true;
                        this.controller.getCommits();
                        scope.targetId = undefined;
                        scope.$apply();
                        expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, this.controller.id);
                        expect(this.controller.error).toEqual(this.error);
                        expect(this.controller.commits).toEqual([]);
                        expect(this.controller.reset).toHaveBeenCalled();
                    });
                    it('with no graph', function() {
                        this.isolatedScope.graph = false;
                        this.controller.getCommits();
                        scope.targetId = undefined;
                        scope.$apply();
                        expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, this.controller.id);
                        expect(this.controller.error).toEqual(this.error);
                        expect(this.controller.commits).toEqual([]);
                        expect(this.controller.reset).not.toHaveBeenCalled();
                    });
                });
            });
        });
        it('should reset graph variables', function() {
            this.controller.reset();
            expect(Snap).toHaveBeenCalled();
            expect(this.controller.deltaX).toBe(10);
        });
    });
    describe('$scope.$watch triggers when changing the', function() {
        beforeEach(function() {
            spyOn(this.controller, 'getCommits');
        });
        it('commitId', function() {
            scope.$apply('commitId = "new"');
            expect(this.controller.getCommits).toHaveBeenCalled();
        });
        it('headTitle', function() {
            scope.$apply('headTitle = "new"');
            expect(this.controller.getCommits).toHaveBeenCalled();
        });
        it('targetId', function() {
            scope.$apply('targetId = "new"');
            expect(this.controller.getCommits).toHaveBeenCalled();
        });
    });
    it('should call openCommitOverlay when an id is clicked', function() {
        scope.$apply();
        this.controller.commits = this.commits;
        scope.$digest();
        var id = angular.element(this.element.querySelectorAll('table tr td.commit-id a')[0]);
        id.triggerHandler('click');
        expect(catalogManagerSvc.getCommit).toHaveBeenCalledWith(this.commits[0].id);
    });
});
