/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { DebugElement, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { GitgraphUserApi } from '@gitgraph/core';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { CommitInfoOverlayComponent } from '../../../shared/components/commitInfoOverlay/commitInfoOverlay.component';
import { Commit } from '../../../shared/models/commit.interface';
import { UtilService } from '../../../shared/services/util.service';
import { GraphHelperService } from '../../services/graph-helper.service';
import { SVGElementHelperService } from '../../services/svgelement-helper.service';
import { CommitHistoryGraphComponent } from './commit-history-graph.component';
import { Branch as GitGraphBranch } from '@gitgraph/js';
import { GitAction } from '../../models/git-action.interface';
import { GitgraphCommitOptions } from '@gitgraph/core';

describe('CommitHistoryGraphComponent', () => {
  let component: CommitHistoryGraphComponent;
  let fixture: ComponentFixture<CommitHistoryGraphComponent>;
  let element: DebugElement;
  let matDialogMock: jasmine.SpyObj<MatDialog>;
  let utilServiceMock: jasmine.SpyObj<UtilService>;
  let graphHelperServiceMock: jasmine.SpyObj<GraphHelperService>;
  let svgElementHelperServiceMock: jasmine.SpyObj<SVGElementHelperService>;
  let commitId: string;
  let recordId: string;
  let commit: Commit;
  let commits: Commit[];
  let gitActions: GitAction[];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ 
        CommitHistoryGraphComponent 
      ],
      providers: [
        SVGElementHelperService,
        MockProvider(GraphHelperService),
        MockProvider(UtilService),
        { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
            open: { afterClosed: () => of(true)}
          })
        }
      ]
    })
    .compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(CommitHistoryGraphComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    matDialogMock = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    utilServiceMock = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
    graphHelperServiceMock = TestBed.inject(GraphHelperService) as jasmine.SpyObj<GraphHelperService>;
    svgElementHelperServiceMock = TestBed.inject(SVGElementHelperService) as jasmine.SpyObj<SVGElementHelperService>;
    commitId = 'commitId';
    commit = {
        id: commitId,
        creator: {
            username: 'user',
            firstName: 'firstName',
            lastName: 'lastName'
        },
        date: 'somedate',
        message: 'message',
        base: 'baseHash',
        auxiliary: 'auxiliaryHash'
    };
    commits = [commit];
    gitActions = [
      {
        'action': 'create-branch',
        'branch': 'HEAD'
      },
      {
        'action': 'commit',
        'branch': 'HEAD',
        'commit': commit,
      },
      {
        'action': 'create-branch',
        'branch': 'BRANCH-0001'
      },
      {
        'action': 'create-branch',
        'branch': 'BRANCH-0002'
      },
    ];
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
    expect(matDialogMock).toBeTruthy();
    expect(utilServiceMock).toBeTruthy();
    expect(graphHelperServiceMock).toBeTruthy();
    expect(svgElementHelperServiceMock).toBeTruthy();
  });
  it('commitDotOnClick should emit', () => {
    component.commitDotOnClick.subscribe({next: (commit: Commit) => {
      expect(commit.id).toEqual(commitId);
    }, error: (error) => {
      fail('commitDotOnClick should not fail');
    }})
    component.commitDotOnClick.emit(commit);
  });
  describe('ngOnChanges triggers when changing the', function() {
    beforeEach(function() {
        spyOn(component, 'drawGraph');
    });
    it('commits when afterViewInitCalled is true', function() {
      component.afterViewInitCalled = true;
      component.ngOnChanges({
        commits: new SimpleChange(null, 'new', true)
      });
      expect(component.drawGraph).toHaveBeenCalledWith();
    });
    it('commits when afterViewInitCalled is false', function() {
      component.afterViewInitCalled = false;
      component.ngOnChanges({
        commits: new SimpleChange(null, 'new', true)
      });
      expect(component.drawGraph).not.toHaveBeenCalledWith();
    });
    it('headTitle when afterViewInitCalled is true', function() {
      component.afterViewInitCalled = true;
      component.ngOnChanges({
          headTitle: new SimpleChange(null, 'new', true)
      });
      expect(component.drawGraph).toHaveBeenCalledWith();
    });
    it('headTitle when afterViewInitCalled is false', function() {
      component.afterViewInitCalled = false;
      component.ngOnChanges({
          headTitle: new SimpleChange(null, 'new', true)
      });
      expect(component.drawGraph).not.toHaveBeenCalledWith();
    });
    it('recordId when afterViewInitCalled is true', function() {
      component.afterViewInitCalled = true;
      component.ngOnChanges({
        recordId: new SimpleChange(null, 'new', true)
      });
      expect(component.drawGraph).toHaveBeenCalledWith();
    });
    it('recordId when afterViewInitCalled is false', function() {
      component.afterViewInitCalled = true;
      component.ngOnChanges({
        recordId: new SimpleChange(null, 'new', true)
      });
      expect(component.drawGraph).toHaveBeenCalledWith();
    });
    it('commitDotClickable when afterViewInitCalled is true', function() {
      component.afterViewInitCalled = true;
      component.ngOnChanges({
        commitDotClickable: new SimpleChange(null, true, true)
      });
      expect(component.drawGraph).toHaveBeenCalledWith();
    });
    it('commitDotClickable when afterViewInitCalled is false', function() {
      component.afterViewInitCalled = false;
      component.ngOnChanges({
        commitDotClickable: new SimpleChange(null, true, true)
      });
      expect(component.drawGraph).not.toHaveBeenCalledWith();
    });
  });
  describe('ngAfterViewInit triggers', function() {
    beforeEach(function() {
        spyOn(component, 'drawGraph');
    });
    it('dataBindingsChanged is true', function() {
      component.dataBindingsChanged = true;
      component.ngAfterViewInit();
      expect(component.drawGraph).toHaveBeenCalledWith();
    });
    it('dataBindingsChanged is false', function() {
      component.dataBindingsChanged = false;
      component.ngAfterViewInit();
      expect(component.drawGraph).not.toHaveBeenCalledWith();
    });
  });
  describe('contains the correct html', function() {
    it('for wrapping containers', function() {
        expect(element.queryAll(By.css('div.commit-graph-wrapper')).length).toEqual(1);
    });
  });
  describe('controller methods', function() {
    it('createBranchAction adds a branch to gitGraphBranches', async function() {
      const mockGitBranch: jasmine.SpyObj<GitGraphBranch> = jasmine.createSpyObj('GitGraphBranch', ['commit']);
      const mockGitGraph: jasmine.SpyObj<GitgraphUserApi<SVGElement>> = jasmine.createSpyObj('GitgraphUserApi<SVGElement>', ['branch', 'clear']);
      mockGitGraph.branch.and.returnValue(mockGitBranch);
      component.gitGraph = mockGitGraph;
      component.createBranchAction(gitActions[0]);
      expect(component.gitGraphBranches).toEqual([mockGitBranch]);
      expect(mockGitGraph.branch).toHaveBeenCalled();
    });
    describe('commitAction commits to a branch', function() {
      beforeEach(function() {
        spyOn(component, 'createCommitOptions');
      });
      it('successfully', async function() {
        const mockGitBranch: jasmine.SpyObj<GitGraphBranch> = jasmine.createSpyObj('GitGraphBranch', ['commit'], {name: 'HEAD'});
        component.gitGraphBranches = [ mockGitBranch ];
        component.commitAction(gitActions[1], 0);
        expect(component.createCommitOptions).toHaveBeenCalledWith(gitActions[1]);
        expect(mockGitBranch.commit).toHaveBeenCalled();
      });
      it('with exception', async function() {
        const mockGitBranch: jasmine.SpyObj<GitGraphBranch> = jasmine.createSpyObj('GitGraphBranch', ['commit'], {name: 'branch1'});
        component.gitGraphBranches = [ mockGitBranch ];
        expect( () => component.commitAction(gitActions[1], 0) ).toThrow(new Error('commitAction[0]: branchToCommit does not exist: HEAD'));
        expect(component.createCommitOptions).not.toHaveBeenCalled();
        expect(mockGitBranch.commit).not.toHaveBeenCalled();
      });
    });
    describe('mergeCommitAction creates GitgraphCommitOptions', function() {
      let mockGitgraphCommitOptions: GitgraphCommitOptions<SVGElement>;
      beforeEach(function() {
        mockGitgraphCommitOptions = jasmine.createSpyObj('GitgraphCommitOptions', ['renderDot']);
        spyOn(component, 'createCommitOptions').and.returnValue(mockGitgraphCommitOptions);
      });
      it('successfully', async function() {
        const mockGitBranch0001: jasmine.SpyObj<GitGraphBranch> = jasmine.createSpyObj('GitGraphBranch', ['commit', 'merge'], {name: 'BRANCH-0001'});
        const mockGitBranch0002: jasmine.SpyObj<GitGraphBranch> = jasmine.createSpyObj('GitGraphBranch', ['commit'], {name: 'BRANCH-0002'});
        component.gitGraphBranches = [mockGitBranch0001 , mockGitBranch0002]
        const gitAction: GitAction = {
          action: 'merge-commit',
          commit: commit,
          mergeTo: 'BRANCH-0001',
          branch: 'BRANCH-0002'
        }
        component.mergeCommitAction(gitAction, 0);
        expect(component.createCommitOptions).toHaveBeenCalledWith(gitAction);
        expect(mockGitBranch0001.merge).toHaveBeenCalledWith({ 
          branch: mockGitBranch0002, 
          commitOptions: mockGitgraphCommitOptions
        });
      });
      it('branchToCommit does not exist', async function() {
        const mockGitBranch0001: jasmine.SpyObj<GitGraphBranch> = jasmine.createSpyObj('GitGraphBranch', ['commit', 'merge'], {name: 'BRANCH-0001'});
        const mockGitBranch0002: jasmine.SpyObj<GitGraphBranch> = jasmine.createSpyObj('GitGraphBranch', ['commit'], {name: 'BRANCH-0002'});
        component.gitGraphBranches = [mockGitBranch0001 , mockGitBranch0002]
        const gitAction: GitAction = {
          action: 'merge-commit',
          commit: commit,
          mergeTo: 'BRANCH-0003',
          branch: 'BRANCH-0002'
        }
        expect(() => component.mergeCommitAction(gitAction, 0) ).toThrow(new Error('mergeCommitAction[0]: branchToCommit does not exist: BRANCH-0003'));
        expect(component.createCommitOptions).not.toHaveBeenCalledWith(gitAction);
        expect(mockGitBranch0001.merge).not.toHaveBeenCalled();
      });
      it('branchToMerge does not exist', async function() {
        const mockGitBranch0001: jasmine.SpyObj<GitGraphBranch> = jasmine.createSpyObj('GitGraphBranch', ['commit', 'merge'], {name: 'BRANCH-0001'});
        const mockGitBranch0002: jasmine.SpyObj<GitGraphBranch> = jasmine.createSpyObj('GitGraphBranch', ['commit'], {name: 'BRANCH-0002'});
        component.gitGraphBranches = [mockGitBranch0001 , mockGitBranch0002]
        const gitAction: GitAction = {
          action: 'merge-commit',
          commit: commit,
          mergeTo: 'BRANCH-0001',
          branch: 'BRANCH-0010'
        }
        expect(() => component.mergeCommitAction(gitAction, 0) ).toThrow(new Error('mergeCommitAction[0]: branchToMerge does not exist: BRANCH-0010'));
        expect(component.createCommitOptions).not.toHaveBeenCalledWith(gitAction);
        expect(mockGitBranch0001.merge).not.toHaveBeenCalled();
      });
    });
    describe('createCommitOptions', function() {
      it('successfully', async function() {
        utilServiceMock.condenseCommitId.and.returnValue('hash');
        const gitgraphCommitOptions: GitgraphCommitOptions<SVGElement> = component.createCommitOptions(gitActions[1]);
        expect(gitgraphCommitOptions).toEqual({
          subject: 'message',
          hash: 'hash',
          author: 'user',
          renderDot: jasmine.any(Function),
          renderMessage: jasmine.any(Function),
          onMessageClick: jasmine.any(Function),
          onClick: jasmine.any(Function),
        });
        expect(utilServiceMock.condenseCommitId).toHaveBeenCalled();
      });
      it('with exception', async function() {
        const gitAction: GitAction = {
          action: 'merge-commit',
          mergeTo: 'BRANCH-0001',
          branch: 'BRANCH-0010'
        };
        expect(() => component.createCommitOptions(gitAction) ).toThrow(new Error('GitAction object commit property is empty'));
      });
    });
    it('openCommitOverlay opens Commit Info Overlay', async function() {
        component.recordId = recordId;
        component.commits = commits;
        component.openCommitOverlay(commitId);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(matDialogMock.open).toHaveBeenCalledWith(CommitInfoOverlayComponent, {
            data: { commit: commit, ontRecordId: recordId }
        });
    });
    it('reset clears gitgraph and clears branches', async function() {
      const mockGitGraph: jasmine.SpyObj<GitgraphUserApi<SVGElement>> = jasmine.createSpyObj('GitgraphUserApi<SVGElement>', ['clear']);
      const mockGitBranch: jasmine.SpyObj<GitGraphBranch> = jasmine.createSpyObj('GitGraphBranch', ['commit']);
      component.gitGraph = mockGitGraph;
      component.gitGraphBranches = [mockGitBranch];
      component.reset();
      expect(component.gitGraph.clear).toHaveBeenCalled();
      expect(component.gitGraphBranches).toEqual([]);
    });
  });
});
