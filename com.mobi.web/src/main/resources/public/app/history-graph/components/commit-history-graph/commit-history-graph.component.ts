/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
  IterableDiffer,
  IterableDiffers,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {find} from 'lodash';
import {v4} from 'uuid';
import {Branch as GitGraphBranch, createGitgraph, templateExtend, TemplateName} from '@sourceflow/gitgraph-js';
import {
  Branch,
  Commit as GitGraphCommit,
  GitgraphBranchOptions,
  GitgraphCommitOptions,
  GitgraphMergeOptions,
  GitgraphOptions,
  GitgraphUserApi,
  MergeStyle
} from '@sourceflow/gitgraph-core';

import {SVGElementHelperService} from '../../services/svgelement-helper.service';
import {Commit} from '../../../shared/models/commit.interface';
import {CommitInfoOverlayComponent} from '../../../shared/components/commitInfoOverlay/commitInfoOverlay.component';
import {GraphHelperService} from '../../services/graph-helper.service';
import {GitAction} from '../../models/git-action.interface';
import {JSONLDObject} from '../../../shared/models/JSONLDObject.interface';
import {BranchNames} from '../../models/branch-names.interface';
import {Tag} from '../../../shared/models/tag.interface';
import {condenseCommitId, getDate, getDctermsValue} from '../../../shared/utility';
import {CATALOG} from '../../../prefixes';
import {User} from '../../../shared/models/user.class';

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
export class CommitHistoryGraphComponent implements OnChanges, AfterViewInit, DoCheck, OnInit {
  @Input() commits: Commit[];
  @Input() headTitle?: string;
  @Input() recordId?: string;
  @Input() commitDotClickable: boolean;
  @Input() type: string;
  @Input() branches: JSONLDObject[] = [];
  @Input() tags: Tag[] = [];
  @Output() commitDotOnClick = new EventEmitter<Commit>();

  constructor(private dialog: MatDialog,
              private svgElementHelperService: SVGElementHelperService,
              private graphHelperService: GraphHelperService,
              private iterableDiffers: IterableDiffers) {
  }

  branchesDiffer: IterableDiffer<JSONLDObject>;
  tagMap: Map<string, string[]>;
  errors: string[] = [];
  afterViewInitCalled = false;
  dataBindingsChanged = false;
  componentUuidId = `${v4()}`; // Used to differentiate multiple gitgraph containers in the same html page 
  gitGraph: GitgraphUserApi<SVGElement>;
  gitGraphBranches: GitGraphBranch[] = [];
  branchesNames: BranchNames[] = [];
  gitGraphHtmlContainer: HTMLElement;
  gitGraphHtmlContainerId = `gitgraph-container-id-${this.componentUuidId}`;
  headURI = CATALOG + 'head';
  branchTemplateOptions = {
    lineWidth: 2,
    mergeStyle: MergeStyle.Bezier,
    spacing: 20,
    label: {
      display: true,
      bgColor: 'white',
      font: 'normal 12pt Arial',
      borderRadius: 10
    }
  }
  behindBranches: { title: string, commitId: string, action: string }[] = [];
  gitGraphOptions: GitgraphOptions = {
    template: templateExtend(TemplateName.Metro, {
      arrow: {
        size: null,
        color: null,
        offset: 2
      },
      branch: this.branchTemplateOptions,
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

  ngOnInit(): void {
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

  ngDoCheck(): void {
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
      if (lastCommitId) {
        const headBranch = this.branches.find(item => item[this.headURI][0]['@id'] === lastCommitId);
        const headTitle = getDctermsValue(headBranch, 'title');
        headTitleTemp = headTitle ? headTitle : condenseCommitId(lastCommitId);
      } else {
        headTitleTemp = 'master';
      }
    }

    this.errors = [];
    this.behindBranches = [];
    this.reset();

    const actions = this.graphHelperService.getGraphActions(this.commits, headTitleTemp);
    this.updateBranchListCollection(actions);

    actions.forEach((gitAction: GitAction, index: number) => {
      try {
        if (gitAction.action === 'create-branch') {
          this.createBranchAction(gitAction);
        } else if (gitAction.action === 'commit') {
          this.commitAction(gitAction, index);
        } else if (gitAction.action === 'merge-commit') {
          this.mergeCommitAction(gitAction, index);
        }
        // Add Tag to commit
        if (gitAction?.commit?.id) {
          const label = this.getTags(gitAction?.commit?.id);
          if (label) {
            this.gitGraph.tag({name: label, render: (name, style) => this.svgElementHelperService.createTag(name, style)});
          }
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
    this.updateBranchOptions(branchOptions, gitAction);
    const createdBranch = this.gitGraph.branch(branchOptions);
    this.gitGraphBranches.push(createdBranch);
  }

  commitAction(gitAction: GitAction, index: number): void {
    const branchToCommit = find(this.gitGraphBranches, (branch: GitGraphBranch) => branch.name === gitAction.branch);
    if (!branchToCommit) {
      throw Error(`commitAction[${index}]: branchToCommit does not exist: ${gitAction.branch}`);
    }

    const commitOptions: GitgraphCommitOptions<SVGElement> = this.createCommitOptions(gitAction);
    const renderLabel = this.getRenderLabel(gitAction);

    const options: GitgraphBranchOptions<SVGElement> = {
      name: gitAction.branch || 'unknown branch',
      renderLabel: renderLabel
    };
    this.updateBranchOptions(options, gitAction);
    if (branchToCommit.branch) {
      branchToCommit.branch(options);
    }
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

    const options: GitgraphBranchOptions<SVGElement> = {
      name: gitAction.branch || 'unknown branch',
      renderLabel: this.getRenderLabel(gitAction)
    };

    this.updateBranchOptions(options, gitAction);

    if (branchToMerge.branch) {
     branchToMerge.branch(options);
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
      hash: condenseCommitId(commitId),
      author: User.getDisplayName(gitAction.commit.creator),
      renderDot: (svgCommit: GitGraphCommit) => {
        if (gitAction.renderBranchLabel) {
          svgCommit.showLabel = true;
          svgCommit.commitLabel = gitAction.optionalLabel;
        }
        return this.svgElementHelperService.renderCommitDot(svgCommit, this.componentUuidId, this.commitDotClickable);
      },
      renderMessage: (svgCommit: GitGraphCommit) => {
       return  this.svgElementHelperService.renderCommitMessage(svgCommit, getDate(commitDate, 'd MMM yyyy'));
      },
      onMessageClick: () => this.openCommitOverlay(commitId),
      onClick: () => this.commitDotOnClick.emit(gitAction.commit)
    };
  }

  /**
   * Update git-graph style options.
   * @param options
   * @param gitAction
   */
  updateBranchOptions(options:GitgraphBranchOptions<SVGElement>, gitAction:GitAction): void {
    const behindBranch = this.filterBehindBranchList(gitAction);
    if (!this.branchesNames.find(item => item.name === gitAction.branch) || !!behindBranch) {
      options.style = {
        label: {
          display: false
        }
      };
    }
  }
  openCommitOverlay(commitId: string): void {
    this.dialog.open(CommitInfoOverlayComponent, {
      data: {
        commit: find(this.commits, {id: commitId}),
        recordId: this.recordId,
        type: this.type
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
        name: getDctermsValue(branch, 'title') || ''
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
  /**
   * Gets the branch with the given title, if it exists.
   *
   * @param name The title of the branch to find.
   * @returns The branch with the given title, if it exists, or `null` if no such
   * branch exists.
   */
  private getBranchByTitle(name:string): JSONLDObject {
    return this.branches
        .find(b => name === getDctermsValue(b, 'title'));
  }

  /**
   * Modifies the state of the behindBranches array when the commit ID of a branch differs from the head commit's ID.
   * @param headCommit  (string): The ID of the head.
   * @param commitId (string): The commit ID to compare with headCommit
   * @param title  (string): The title of the branch associated with the commit.
   * @param action gitGraph action
   * @private
   */
  private updateBranchListState(headCommit:string, commitId:string, title:string, action:string): void {
    if (headCommit !== commitId && this.commits[0]?.id !== headCommit) {
      this.behindBranches.push({title, commitId, action});
    }
  }

  /**
   * Filter list by action
   * @param gitAction
   * @private
   */
  private filterBehindBranchList(gitAction:GitAction): boolean {
    if (gitAction.commit) {
      return this.behindBranches
          .filter(action => action.action === gitAction.action)
          .some(item => item.title === gitAction.branch && gitAction.commit.id !== item.commitId);
    } else {
      return this.behindBranches
          .some(item => item.title === gitAction.branch && gitAction.atCommit !== item.commitId
              && item.action === gitAction.action);
    }
  }
  /**
   * Filters action 'merge-commit' and 'commit' types,
   * and then updates the state of branch lists based on the actions' information.
   * @param actions
   * @private
   */
  private  updateBranchListCollection(actions: GitAction[]): void {
    const mergeActions = actions.filter((gitAction: GitAction) => gitAction.action === 'merge-commit');
    const commitActions =  actions.filter((gitAction: GitAction) => gitAction.action === 'commit');
    mergeActions.forEach((gitAction: GitAction) => {
      const branch = this.getBranchByTitle(gitAction.mergeTo);
      if (branch) {
        this.updateBranchListState(branch[this.headURI][0]['@id'], 
          gitAction.commit.id, 
          getDctermsValue(branch, 'title'), 
          'merge-commit');
      }
    });

    commitActions.forEach((gitAction: GitAction) => {
      const branch = this.getBranchByTitle(gitAction.branch);
      if (branch) {
        this.updateBranchListState(branch[this.headURI][0]['@id'], 
          gitAction.commit.id, 
          getDctermsValue(branch, 'title'), 
          'commit');
      }
    });
  }

  /**
   * Finds the branch in the collection of branches based on the given gitAction.
   *
   * @param {Object} gitAction - The git action object representing a commit.
   * @returns {Object} - The branch object that matches the gitAction commit ID.
   */
  private findBranch(gitAction): JSONLDObject[] {
    return this.branches.filter(item => item[this.headURI][0]['@id'] === gitAction.commit.id);
  }

  /**
   * Updates commit label for the given git action and branch.
   * If a branch is provided and the git action does not have an optional label,
   * the branch's title will be used as the optional label.
   *
   * @param {object} gitAction - The git action to update the commit label for.
   * @param {object} branches - The branch to use for the optional label.
   */
  private updateCommitLabel(gitAction: GitAction, branches: JSONLDObject[]): void {
    if (!branches || branches.length === 0) {
      return; // Handle empty branches early
    }
    const length = branches.length;

    const [firstTitle, secondTitle] = this.getBranchesTitle(gitAction, branches);

    gitAction.optionalLabel = length > 1 ? `${firstTitle} | ${secondTitle}` : firstTitle;
    if (length > 2) {
      gitAction.optionalLabel +=  ' | ...';
    }
    gitAction.renderBranchLabel = true;
  }

  /**
   * Finds branch titles for a given git action and list of branches.
   *
   * @param gitAction - The git action object containing the branch to find titles for.
   * @param branches - An array of JSONLD objects representing the branches.
   * @returns An array of branch titles as strings.
   */
  private getBranchesTitle(gitAction: GitAction, branches: JSONLDObject[]): [string, string] {
    let firstTitle = gitAction.branch;
    let secondTitle = '';
    const hasCurrentBranch = branches.some(item => this.getBranchTitle(item) === firstTitle);
    if (hasCurrentBranch) {
      const otherBranch = branches.find(item => this.getBranchTitle(item) !== firstTitle);
      secondTitle = this.getBranchTitle(otherBranch);
    } else {
      firstTitle = this.getBranchTitle(branches[0]);
      secondTitle = this.getBranchTitle(branches[1]);
    }
    return [firstTitle, secondTitle];
  }
  /**
   * Retrieves the rendering label for the given git action.
   *
   * @param {object} gitAction - The git action object.
   * @return {Function} - A function that returns the rendered label for the git action.
   */
  private getRenderLabel(gitAction): (gitGraphBranch: Branch<SVGElement>, commit: GitGraphCommit) => SVGElement {
    const branch = this.findBranch(gitAction);
    this.updateCommitLabel(gitAction, branch);

    return (gitGraphBranch: Branch<SVGElement>, commit: GitGraphCommit) => {
      commit.commitLabel = commit.commitLabel && branch ? commit.commitLabel: (gitAction.optionalLabel || gitAction.branch);
      return this.svgElementHelperService.renderBranchLabel(gitGraphBranch, commit);
    };
  }

  /**
   * Retrieves the title of a branch from a JSONLD object.
   *
   * @param {JSONLDObject} branch - The JSONLD object representing a branch.
   * @return {string} - The title of the branch.
   */
  private getBranchTitle(branch: JSONLDObject): string {
    return getDctermsValue(branch, 'title');
  }

}
