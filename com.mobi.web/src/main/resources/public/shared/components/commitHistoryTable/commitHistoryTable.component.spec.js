/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Commit History Table component', function() {
    var $compile, scope, $q, catalogManagerSvc, Snap, modalSvc;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockComponent('shared', 'errorDisplay');
        mockComponent('shared', 'infoMessage');
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
        this.entityId = 'entity';
        this.commits = [{id: this.commitId}];

        scope.headTitle = 'title';
        scope.commitId = this.commitId;
        scope.targetId = this.commitId;
        scope.entityId = this.entityId;
        scope.receiveCommits = jasmine.createSpy('receiveCommits');
        scope.entityNameFunc = jasmine.createSpy('entityNameFunc');
        this.element = $compile(angular.element('<commit-history-table commit-id="commitId" head-title="headTitle" target-id="targetId" entity-id="entityId" receive-commits="receiveCommits(commits)" entity-name-func="entityNameFunc"></commit-history-table>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('commitHistoryTable');
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

    describe('contains the correct html', function() {
        beforeEach(function() {
            this.controller.commits = this.commits;
            scope.$apply();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('COMMIT-HISTORY-TABLE');
            expect(this.element.querySelectorAll('.commit-history-table').length).toEqual(1);
            expect(this.element.querySelectorAll('.wrapper').length).toEqual(1);
        });
        _.forEach(['table', 'thead', 'tbody', 'svg'], item => {
            it('with a ' + item, function() {
                expect(this.element.find(item).length).toEqual(1);
            });
        });
        it('with ths', function() {
            expect(this.element.find('th').length).toEqual(4);
        });
        it('with the correct styles based on whether a graph should be shown', function() {
            var svg = this.element.find('svg');
            expect(svg.css('height')).toEqual('0px');
            expect(svg.css('width')).toEqual('0px');

            this.controller.showGraph = true;
            scope.$digest();
            expect(svg.css('height')).toEqual((this.controller.commits.length * this.controller.circleSpacing + this.controller.deltaY) + 'px');
            expect(svg.css('width')).not.toEqual('0px');
        });
        it('depending on whether there is a error', function() {
            expect(this.element.find('error-display').length).toEqual(0);
            this.controller.error = this.error;
            scope.$apply();
            expect(this.element.find('error-display').length).toEqual(1);
        });
        it('depending on whether there are commits', function() {
            expect(this.element.find('info-message').length).toEqual(0);
            this.controller.commits = [];
            this.controller.error = undefined;
            scope.$apply();
            expect(this.element.find('info-message').length).toEqual(1);
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
        it('entityId should be one way bound', function() {
            var original = scope.entityId;
            this.controller.entityId = 'new';
            scope.$digest();
            expect(scope.entityId).toEqual(original);
        });
        it('entityNameFunc should be one way bound', function() {
            this.controller.entityNameFunc = undefined;
            scope.$digest();
            expect(scope.entityNameFunc).toBeDefined();
        });
        it('receiveCommits should be called in the parent scope', function() {
            this.controller.receiveCommits({commits: []});
            expect(scope.receiveCommits).toHaveBeenCalledWith([]);
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
                expect(modalSvc.openModal).toHaveBeenCalledWith('commitInfoOverlay', {commit: {id: this.commitId}, additions: [], deletions: [], entityNameFunc: this.controller.entityNameFunc}, undefined, 'lg');
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
                expect(scope.receiveCommits).toHaveBeenCalledWith([]);
            });
            describe('if a commit has been passed', function() {
                describe('successfully', function() {
                    describe('for a specific entity id', function() {
                        beforeEach(function() {
                            catalogManagerSvc.getCommitHistory.and.returnValue($q.when(this.commits));
                        });
                        it('drawing the graph', function() {
                            this.controller.showGraph = true;
                            this.controller.getCommits();
                            scope.targetId = undefined;
                            scope.$apply();
                            expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, this.entityId, this.controller.id);
                            expect(this.controller.error).toEqual('');
                            expect(this.controller.commits).toEqual(this.commits);
                            expect(this.controller.drawGraph).toHaveBeenCalled();
                        });
                        it('without drawing a graph', function() {
                            this.controller.showGraph = false;
                            this.controller.getCommits();
                            scope.targetId = undefined;
                            scope.$apply();
                            expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, this.entityId, this.controller.id);
                            expect(this.controller.error).toEqual('');
                            expect(this.controller.commits).toEqual(this.commits);
                            expect(this.controller.drawGraph).not.toHaveBeenCalled();
                        });
                    });
                    describe('for a specific commit id', function() {
                        beforeEach(function() {
                            catalogManagerSvc.getCommitHistory.and.returnValue($q.when(this.commits));
                        });
                        it('drawing the graph', function() {
                            this.controller.showGraph = true;
                            this.controller.getCommits();
                            scope.targetId = undefined;
                            scope.entityId = undefined;
                            scope.$apply();
                            expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, undefined, this.controller.id);
                            expect(this.controller.error).toEqual('');
                            expect(scope.receiveCommits).toHaveBeenCalledWith(this.commits);
                            expect(this.controller.commits).toEqual(this.commits);
                            expect(this.controller.drawGraph).toHaveBeenCalled();
                        });
                        it('without drawing a graph', function() {
                            this.controller.showGraph = false;
                            this.controller.getCommits();
                            scope.targetId = undefined;
                            scope.entityId = undefined;
                            scope.$apply();
                            expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, undefined, this.controller.id);
                            expect(this.controller.error).toEqual('');
                            expect(scope.receiveCommits).toHaveBeenCalledWith(this.commits);
                            expect(this.controller.commits).toEqual(this.commits);
                            expect(this.controller.drawGraph).not.toHaveBeenCalled();
                        });
                    });
                    describe('for a difference between commits', function() {
                        beforeEach(function() {
                            catalogManagerSvc.getCommitHistory.and.returnValue($q.when(this.commits));
                        });
                        it('drawing the graph', function() {
                            this.controller.showGraph = true;
                            this.controller.getCommits();
                            scope.entityId = undefined;
                            scope.$apply();
                            expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(this.commitId, this.commitId, undefined, this.controller.id);
                            expect(this.controller.error).toEqual('');
                            expect(scope.receiveCommits).toHaveBeenCalledWith(this.commits);
                            expect(this.controller.commits).toEqual(this.commits);
                            expect(this.controller.drawGraph).toHaveBeenCalled();
                        });
                        it('without drawing a graph', function() {
                            this.controller.showGraph = false;
                            this.controller.getCommits();
                            scope.entityId = undefined;
                            scope.$apply();
                            expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(this.commitId, this.commitId, undefined, this.controller.id);
                            expect(this.controller.error).toEqual('');
                            expect(scope.receiveCommits).toHaveBeenCalledWith(this.commits);
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
                        this.controller.showGraph = true;
                        this.controller.getCommits();
                        scope.targetId = undefined;
                        scope.entityId = undefined;
                        scope.$apply();
                        expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, undefined, this.controller.id);
                        expect(this.controller.error).toEqual(this.error);
                        expect(scope.receiveCommits).toHaveBeenCalledWith([]);
                        expect(this.controller.commits).toEqual([]);
                        expect(this.controller.reset).toHaveBeenCalled();
                    });
                    it('with no graph', function() {
                        this.controller.showGraph = false;
                        this.controller.getCommits();
                        scope.targetId = undefined;
                        scope.entityId = undefined;
                        scope.$apply();
                        expect(catalogManagerSvc.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, undefined, this.controller.id);
                        expect(this.controller.error).toEqual(this.error);
                        expect(scope.receiveCommits).toHaveBeenCalledWith([]);
                        expect(this.controller.commits).toEqual([]);
                        expect(this.controller.reset).not.toHaveBeenCalled();
                    });
                });
            });
        });
        it('should reset graph variables', function() {
            this.controller.reset();
            expect(Snap).toHaveBeenCalled();
            expect(this.controller.deltaX).toEqual(10);
        });
    });
    describe('$onChanges triggers when changing the', function() {
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
        it('entityId', function() {
            scope.$apply('entityId = "new"');
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
