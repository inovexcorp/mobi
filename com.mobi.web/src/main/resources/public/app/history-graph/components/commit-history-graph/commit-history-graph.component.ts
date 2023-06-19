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
import {
  AfterViewInit,
  Component,
  DoCheck,
  EventEmitter,
  Input,
  IterableDiffer, IterableDiffers,
  OnChanges, OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { SVGElementHelperService } from '../../services/svgelement-helper.service';

import { find } from 'lodash';
import { v4 } from 'uuid';

import { Branch as GitGraphBranch, createGitgraph, templateExtend, TemplateName } from '@gitgraph/js';
import { Commit as GitGraphCommit } from '@gitgraph/core/lib/commit';

import { GitgraphOptions, GitgraphCommitOptions, GitgraphMergeOptions, GitgraphBranchOptions, MergeStyle } from '@gitgraph/core';
import { GitgraphUserApi } from '@gitgraph/core/lib/user-api/gitgraph-user-api';

import { UtilService } from '../../../shared/services/util.service';
import { Commit } from '../../../shared/models/commit.interface';
import { MatDialog } from '@angular/material/dialog';
import { CommitInfoOverlayComponent } from '../../../shared/components/commitInfoOverlay/commitInfoOverlay.component';
import { GraphHelperService } from '../../services/graph-helper.service';
import { GitAction } from '../../models/git-action.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { BranchNames } from '../../models/branch-names.interface';
import { Tag } from '../../../shared/models/tag.interface';

/**
 * @class history-graph.CommitHistoryGraphComponent
 *
 * A directive that creates a graph containing the commit chain of the provided commit. Displays a
 * SVG graph generated using gitgraph.js showing the network of the commits along with a title for the top
 * commit. Clicking on a commit id or its corresponding circle in the graph will open up a
 * {@link shared.CommitInfoOverlayComponent commit info overlay}. Can optionally provide a variable to bind the
 * retrieved commitDotOnClick to
 * 
 * @param {string} commits The IRI string of a commit in the local catalog
 * @param {string} [headTitle=''] headTitle The optional title to put on the top commit
 * @param {string} [recordId=''] recordId The optional IRI string of an OntologyRecord associated with the commit
 * @param {string} [dotText=''] dotText The optional dot text for commit
 * @param {EventEmitter} [commitDotOnClick] commitDotOnClick The optional function, occurs on commit onClick event
 */
@Component({
  selector: 'commit-history-graph',
  templateUrl: './commit-history-graph.component.html',
  styleUrls: ['./commit-history-graph.component.scss']
})
export class CommitHistoryGraphComponent implements OnChanges, AfterViewInit, DoCheck, OnInit  {
  @Input() commits: Commit[];
  @Input() headTitle?: string;
  @Input() recordId?: string;
  @Input() commitDotClickable: boolean;
  @Input() branches: JSONLDObject[] = [];
  @Input() tags: Tag[] = [];
  @Output() commitDotOnClick = new EventEmitter<Commit>();

  constructor(private util: UtilService,
    private dialog: MatDialog, 
    private svgElementHelperService: SVGElementHelperService,
    private graphHelperService: GraphHelperService, private iterableDiffers: IterableDiffers) {}

  branchesDiffer: IterableDiffer<JSONLDObject>;
  tagMap: Map<string, string[]>;
  errors: string[] = [];
  afterViewInitCalled = false;
  dataBindingsChanged = false;
  componentUuidId = `${v4()}`; // Used to differentiate multiple gitgraph containers in the same html page 
  gitGraph: GitgraphUserApi<SVGElement>;
  gitGraphBranches: GitGraphBranch[] = [];
  branchesNames: BranchNames[] = []
  gitGraphHtmlContainer: HTMLElement;
  gitGraphHtmlContainerId = `gitgraph-container-id-${this.componentUuidId}`; 
  gitGraphOptions: GitgraphOptions = {
      template: templateExtend(TemplateName.Metro, {
        arrow: {
          size: null,
          color: null,
          offset: 2
        },
        branch: {
          lineWidth: 2,
          mergeStyle: MergeStyle.Bezier,
          spacing: 20,
          label: {
            display: true,
            bgColor: 'white',
            font: 'normal 12pt Arial',
            borderRadius: 10
          }
        },
        commit: {
          spacing: 50,
          hasTooltipInCompactMode: true,
          dot: {
            size: 6,
            strokeWidth: 0,
            font: 'normal 12pt Arial'
          },
          message: {
            font: 'normal 12pt Arial'
          }
        }
    })
  }

  ngOnInit() {
    this.branchesDiffer = this.iterableDiffers.find([]).create(null);
    this.tagMapInit(this.tags);
  }

  ngOnChanges(changesObj: SimpleChanges): void {
    if (changesObj?.commits || changesObj?.headTitle || changesObj?.recordId || changesObj?.commitDotClickable || changesObj?.branches || changesObj?.tags) {
      this.tagMapInit(this.tags);
      this.dataBindingsChanged = true;
      if (this.afterViewInitCalled) {
        this.drawGraph();
        this.dataBindingsChanged = false;
      }
    }
  }

  ngDoCheck() {
    const changes = this.branchesDiffer.diff(this.branches);
    if (changes) {
      this.dataBindingsChanged = true;
      if (this.afterViewInitCalled) {
        this.branchesNames = this.getBranchesName();
        this.drawGraph();
        this.dataBindingsChanged = false;
      }
    }
  }

  ngAfterViewInit(): void {
    this.afterViewInitCalled = true;
    const gitGraphHtmlContainerIdTemp = document.getElementById(this.gitGraphHtmlContainerId);
    this.branchesNames = this.getBranchesName();

    if (!this.gitGraph && gitGraphHtmlContainerIdTemp) {
      this.gitGraphHtmlContainer = gitGraphHtmlContainerIdTemp;
      this.gitGraph = createGitgraph(this.gitGraphHtmlContainer, this.gitGraphOptions);
    }
    if (this.dataBindingsChanged) {
      this.drawGraph();
      this.dataBindingsChanged = false;
    }
  }
  /**
   * Draw Graph 
   */
  drawGraph(): void {
    let headTitleTemp = this.headTitle || '';
    if (!headTitleTemp) {
      const lastCommitId = this.commits[0]?.id;
      headTitleTemp = lastCommitId ? this.util.condenseCommitId(lastCommitId) : 'master';
    }
    this.errors = [];
    this.reset();
    const actions = this.graphHelperService.getGraphActions(this.commits, headTitleTemp);
    actions.forEach((gitAction: GitAction, index: number) => {
      try {
        if (gitAction.action === 'create-branch') {
          this.createBranchAction(gitAction);
        } else if (gitAction.action === 'commit') {
          this.commitAction(gitAction, index);
        } else if (gitAction.action === 'merge-commit') {
          this.mergeCommitAction(gitAction, index);
        }
      } catch (error) {
        this.errors.push(error);
      }
    });
  }
  createBranchAction(gitAction: GitAction): void {
    const branchOptions: GitgraphBranchOptions<SVGElement> = {
      name: gitAction.branch || 'unknown branch',
      renderLabel: this.svgElementHelperService.renderBranchLabel
    };

    if (!this.branchesNames.find(item => item.name === branchOptions.name))  {
      branchOptions.style = {
        label: {
          display: false
        }
      };
    }
    const createdBranch = this.gitGraph.branch(branchOptions);
    this.gitGraphBranches.push(createdBranch);
  }
  commitAction(gitAction: GitAction, index: number): void {
    const branchToCommit = find(this.gitGraphBranches, (branch: GitGraphBranch) => branch.name === gitAction.branch);
    if (!branchToCommit) {
      throw Error(`commitAction[${index}]: branchToCommit does not exist: ${gitAction.branch}`);
    }
    const commitOptions: GitgraphCommitOptions<SVGElement> = this.createCommitOptions(gitAction);
    branchToCommit.commit(commitOptions);
  }
  mergeCommitAction(gitAction: GitAction, index: number): void {
    const branchToCommit = find(this.gitGraphBranches, (branch: GitGraphBranch) => branch.name === gitAction.mergeTo);
    const branchToMerge = find(this.gitGraphBranches, (branch: GitGraphBranch) => branch.name === gitAction.branch);
    if (!branchToCommit) {
      throw Error(`mergeCommitAction[${index}]: branchToCommit does not exist: ${gitAction.mergeTo}`);
    }
    if (!branchToMerge) {
      throw Error(`mergeCommitAction[${index}]: branchToMerge does not exist: ${gitAction.branch}`);
    }
    const mergeOptions: GitgraphMergeOptions<SVGElement> = {
      branch: branchToMerge,
      commitOptions: this.createCommitOptions(gitAction)
    };
    branchToCommit.merge(mergeOptions);
  }
  createCommitOptions(gitAction: GitAction): GitgraphCommitOptions<SVGElement> {
    if (!gitAction.commit) {
      throw Error('GitAction object commit property is empty');
    }
    const commitId = gitAction.commit.id;
    const commitDate = gitAction.commit.date || '' ; 
    return {
      subject: gitAction.commit.message,
      hash: this.util.condenseCommitId(commitId),
      author: gitAction.commit.creator.username,
      tag: this.getTags(commitId),
      renderDot: (svgCommit: GitGraphCommit) => {
        return this.svgElementHelperService.renderCommitDot(svgCommit, this.componentUuidId, this.commitDotClickable); 
      },
      renderMessage: (svgCommit: GitGraphCommit) => { 
        return this.svgElementHelperService.renderCommitMessage(svgCommit, this.util.getDate(commitDate, 'd MMM yyyy')); 
      },
      onMessageClick: (_svgCommit: GitGraphCommit) => this.openCommitOverlay(commitId),
      onClick: (_svgCommit: GitGraphCommit) => this.commitDotOnClick.emit(gitAction.commit)
    };
  }
  openCommitOverlay(commitId: string): void {
    this.dialog.open(CommitInfoOverlayComponent, {
        data: {
            commit: find(this.commits, {id: commitId}),
            ontRecordId: this.recordId
        }
    });
  }
  reset(): void {
    this.gitGraph.clear();
    this.gitGraphBranches = [];
  }
  getBranchesName(): BranchNames[] {
    return this.branches.map (branch => {
      return  {
        name: this.util.getDctermsValue(branch, 'title') || ''
      };
    });
  }

  private tagMapInit(tags: Tag[]): void {
    this.tagMap = new Map<string, string[]>();
    tags.forEach(tag => {
      let tagArray: string[] = [];
      if (this.tagMap.has(tag.commitIri)) {
        tagArray = this.tagMap.get(tag.commitIri);
        tagArray.push(tag.title);
      } else {
        tagArray = [tag.title];
      }
      this.tagMap.set(tag.commitIri, tagArray);
    });
  }
  private getTags(commitId: string): string {
    if (this.tagMap.has(commitId)) {
      return this.tagMap.get(commitId).join(' | ');
    }
    return undefined;
  }
}
