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
import { Injectable } from '@angular/core';
import { CommitColumn } from '../../history-graph/models/commit-column.interface';
import { Commit } from '../../shared/models/commit.interface';

import { find, includes, isEmpty } from 'lodash';
import { GitAction } from '../models/git-action.interface';

@Injectable({
  providedIn: 'root'
})
export class GraphHelperService {
  constructor() { }
  /**
   * Get Graph Actions
   * @param commits List of commits. Assumption: Commits are in DESC order by date
   * @param headTitle The title of the head
   * @returns List of GitAction
   */
  getGraphActions(commits: Commit[], headTitle: string): GitAction[] {
    const commitColumns = this.setupCommitColumns(commits, headTitle);
    const actions: GitAction[] = [];
    actions.push({
      action: 'create-branch',
      branch: headTitle
    });
    // Reverse so that Commits are in ASC order by date
    commits.slice().reverse().forEach((commit: Commit) => {
      // Find the column where the commit exists
      const columnToCommit: CommitColumn | undefined = find(commitColumns, col => includes(col.commitHashes, commit.id));
      if (!columnToCommit) {
        throw Error('CommitColumn was not found for commit: ' + commit.id);
      }
      if (isEmpty(commit.auxiliary)) {
        const currentGitAction: GitAction = {
          action: 'commit',
          branch: columnToCommit.branchName || '**UNKNOWN BRANCH**',
          commit: commit
        };
        if (isEmpty(commit.auxiliary) && isEmpty(commit.base) && isEmpty(commit.branch)) {
          currentGitAction.branch = headTitle;
        }
        // Commit to the current branch
        actions.push(currentGitAction);
      } else {
          // This is a merge commit. Merge branches
          const mergeCommitColumn = find(commitColumns, col => includes(col.commitHashes, commit.auxiliary));
          actions.push({
            action: 'merge-commit',
            branch: mergeCommitColumn?.branchName || '**UNKNOWN BRANCH**',
            commit: commit,
            mergeTo: columnToCommit.branchName
          });
      }
      // Create branch if this commit is the base of a branch
      commitColumns.forEach((commitColumn: CommitColumn) => {
          if (commitColumn.startCommitHash === commit.id) {
            actions.push({
              action: 'create-branch',
              branch: commitColumn.branchName || '**UNKNOWN BRANCH**',
              atCommit: commit.id
            });
          }
      });
    });
    return this.sortActions(actions);
  }
  /**
   * Sort actions to ensure that branch creation happens first 
   * @param actions GitAction[]
   * @returns GitAction[]
   */
  sortActions(actions: GitAction[]): GitAction[] {
    // Add sort flag to commits that are behind branch creation  
    const createdBranches: string[] = [];
    actions.forEach((gitAction: GitAction) => {
      if (gitAction.action === 'create-branch' && !includes(createdBranches, gitAction.branch)) {
        createdBranches.push(gitAction.branch);
      }
      if (gitAction.action === 'commit' && !includes(createdBranches, gitAction.branch)) {
        gitAction.sortFlag = true;
      }
      if (gitAction.action === 'merge-commit' &&
        !includes(createdBranches, gitAction.branch) &&
        !includes(createdBranches, gitAction.mergeTo)) {
        gitAction.sortFlag = true;
      }
    });
    // Sort actions to ensure creating branch happens before commits on that branch 
    actions.sort((a: GitAction, b: GitAction) => {
      let sortOrder = 0;
      if (!a.sortFlag && b.sortFlag === true) {
        if (a.branch === b.branch) {
          if (a.action === 'create-branch' && (b.action === 'commit' || b.action === 'merge-commit')) {
            sortOrder = -1;
            b.sortFlag = false;
          }
        } else {
          sortOrder = -1;
        }
      } else if (a.sortFlag === true && !b.sortFlag) {
        sortOrder = 1;
      }
      return sortOrder;
    });
    return actions;
  }
  /**
   * Setup CommitColumns
   * @param commits Commits. Assumes that commits are DESC order by commit DATE
   * @param headTitle branch name
   * @returns CommitColumn[]
   */
  setupCommitColumns(commits: Commit[], headTitle: string): CommitColumn[] {
    const commitColumns: CommitColumn[] = [];
    if (commits.length > 0) {
      // Set up head commit and begin recursion
      const commit: Commit = commits[0];
      const defaultCommitColumn: CommitColumn = { 
        commitHashes: [commit.id], 
        branchName: headTitle,
        mergeCommit: false
      };
      commitColumns.push(defaultCommitColumn);
      this.recurse(commits, commitColumns, commit);
      // Handle missing startCommitHash
      const mergeCommitsNoStartCommit: CommitColumn[] = commitColumns.filter((cc) => cc.mergeCommit && !cc.startCommitHash);
      mergeCommitsNoStartCommit.forEach((cc: CommitColumn) => {
        const lastCommit = cc.commitHashes.slice(-1)[0];
        commits.forEach((currentCommit: Commit) =>{
          if (lastCommit === currentCommit.id) {
            if (currentCommit.base || currentCommit.branch) {
              cc.startCommitHash = currentCommit.base !== '' ? currentCommit.base : currentCommit.branch;
            } else {
              cc.startCommitHash = currentCommit.id;
            }
          }
        });
      });
    }
    return commitColumns;
  }
  private recurse(commits: Commit[], commitColumns: CommitColumn[], currentCommit: Commit): void {
    // Find the column this commit belongs to and the ids of its base and auxiliary commits
    const commitColumn: CommitColumn | undefined = find(commitColumns, col => includes(col.commitHashes, currentCommit.id));
    const baseParentHash: string = currentCommit.base !== '' ? currentCommit.base : currentCommit.branch;
    const auxParentHash: string = currentCommit.auxiliary;
    // If there is an auxiliary parent, there is also a base parent
    if (auxParentHash) {
        // Determine whether the base parent is already in a column
        const baseCommit: Commit | undefined = find(commits, {id: baseParentHash});
        const baseCommitColumn: CommitColumn | undefined = find(commitColumns, col => includes(col.commitHashes, baseParentHash));
        if (commitColumn && !baseCommitColumn) {
            // If not in a column, shift the base parent to be beneath the commit
            commitColumn.commitHashes.push(baseParentHash);
        }
        // Determine whether auxiliary parent is already in a column
        const auxCommit: Commit | undefined = find(commits, {id: auxParentHash});
        const auxColumn: CommitColumn | undefined = find(commitColumns, col => includes(col.commitHashes, auxParentHash));
        if (!auxColumn) {
            // If not in a column, shift the auxiliary parent to the left in new column and collect line color
            const regexp = '(?<=Merge of )(.*)(?= into)';
            const branchNameRegExpArray: RegExpMatchArray | null = currentCommit.message.match(regexp);
            if (branchNameRegExpArray ) {
              commitColumns.push({
                commitHashes: [auxParentHash], 
                branchName: branchNameRegExpArray[1], 
                mergeCommit: true
              });
            }
        }
        // Recurse on right only if it wasn't in a column to begin with
        if (baseCommit && !baseCommitColumn) {
           this.recurse(commits, commitColumns, baseCommit);
        }
        // Recurse on left only if it wasn't in a column to begin with
        if (auxCommit && !auxColumn) {
           this.recurse(commits, commitColumns, auxCommit);
        }
    } else if (baseParentHash) {
        // Determine whether the base parent is already in a column
        const baseCommit: Commit | undefined = find(commits, {id: baseParentHash});
        const baseCommitColumn: CommitColumn | undefined = find(commitColumns, commitColumn => includes(commitColumn.commitHashes, baseParentHash));
        if (commitColumn && baseCommit) {
          if (!baseCommitColumn) {
            // If not in a column, push into current column and draw a line between them
            commitColumn.commitHashes.push(baseParentHash);
            // Continue recursion
            this.recurse(commits, commitColumns, baseCommit);
          } else {
              // Identifies the commit this branch was started from
              commitColumn.startCommitHash = baseCommit.id;
          }
        }
    }
  } 
}
