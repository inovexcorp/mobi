/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { TestBed } from '@angular/core/testing';

import { SVGElementHelperService } from './svgelement-helper.service';
import { Branch as GitGraphBranch } from '@sourceflow/gitgraph-core/lib/branch';
import { Commit as GitGraphCommit } from '@sourceflow/gitgraph-core/lib/commit';
import { BranchStyle, CommitStyle, MergeStyle } from '@sourceflow/gitgraph-core/lib/template';

describe('SVGElementHelperService', () => {
  let service: SVGElementHelperService;
  let commitStyle: CommitStyle;
  let branchStyle: BranchStyle;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SVGElementHelperService);
    commitStyle = {
      spacing: 50, 
      hasTooltipInCompactMode: true,
      message: {
        display: false, 
        displayAuthor: true, 
        displayHash: true, 
        font: 'normal 12pt Arial'
      }, 
      dot: {
        size: 6, 
        strokeWidth: 0,
        font: 'normal 12pt Arial'
      }
    };
    branchStyle = {
      lineWidth: 2,
      mergeStyle: MergeStyle.Bezier,
      spacing: 20,
      label: {
        display: true,
        bgColor: 'white',
        font: 'normal 12pt Arial',
        borderRadius: 10
      }
    };
  });
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('renderCommitDot should return svg when commit dot is clickable', () => {
    const commitSVGElement: GitGraphCommit = jasmine.createSpyObj(GitGraphCommit, ['onClick']);
    commitSVGElement.style = commitStyle;
    const svg = service.renderCommitDot(commitSVGElement, 'parentId', true);
    expect(svg).toBeTruthy();
  });
  it('renderCommitDot should return svg when commit dot is not clickable', () => {
    const commitSVGElement: GitGraphCommit = jasmine.createSpyObj(GitGraphCommit, ['onClick']);
    commitSVGElement.style = commitStyle;
    const svg = service.renderCommitDot(commitSVGElement, 'parentId', false);
    expect(svg).toBeTruthy();
  });
  it('renderBranchLabel should return svg', () => {
    const branchLabelSVGElement: GitGraphBranch = jasmine.createSpyObj(GitGraphBranch, ['onClick']);
    const commitLabel: GitGraphCommit = jasmine.createSpyObj(GitGraphCommit,['onClick']);
    branchLabelSVGElement.style = branchStyle;
    const svg = service.renderBranchLabel(branchLabelSVGElement, commitLabel);
    expect(svg).toBeTruthy();
  });
  it('renderCommitMessage should return svg', () => {
    const commitSVGElement: GitGraphCommit = jasmine.createSpyObj(GitGraphCommit, ['onClick']);
    commitSVGElement.style = commitStyle;
    commitSVGElement.author = {
      name: 'name',
      email: '',
      timestamp: 0
    };
    const svg = service.renderCommitMessage(commitSVGElement, 'dateString');
    expect(svg).toBeTruthy();
  });
  it('renderCommitMessage with email should return svg', () => {
    const commitSVGElement: GitGraphCommit = jasmine.createSpyObj(GitGraphCommit, ['onClick']);
    commitSVGElement.style = commitStyle;
    commitSVGElement.author = {
      name: 'name',
      email: 'email',
      timestamp: 0
    };
    const svg = service.renderCommitMessage(commitSVGElement, 'dateString');
    expect(svg).toBeTruthy();
  });
});
