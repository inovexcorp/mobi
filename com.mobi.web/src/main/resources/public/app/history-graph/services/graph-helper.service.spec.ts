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
import { TestBed } from '@angular/core/testing';
import { Commit } from '../../shared/models/commit.interface';
import { CommitColumn } from '../models/commit-column.interface';
import { GitAction } from '../models/git-action.interface';
import { GraphHelperService } from './graph-helper.service';

describe('GraphHelperService', () => {
  let service: GraphHelperService;
  let commits: Commit[];
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphHelperService);
    commits = [
      {
          'id': 'https://mobi.com/commits#66b958378f54f1c02129c28c03a3b36259913444',
          'creator': {
              'firstName': '',
              'lastName': '',
              'username': 'admin'
          },
          'date': '2023-04-20T12:37:31.78108-04:00',
          'message': 'Merge of 1stBranch into MASTER',
          'base': 'https://mobi.com/commits#a5f39a5b53dc81d222e7a9f03ec955a378b8bdbd',
          'auxiliary': 'https://mobi.com/commits#f6db5e0ade198fe9b35b458d2986f418ceacfdf5',
          'branch': ''
      },
      {
          'id': 'https://mobi.com/commits#f6db5e0ade198fe9b35b458d2986f418ceacfdf5',
          'creator': {
              'firstName': '',
              'lastName': '',
              'username': 'admin'
          },
          'date': '2023-04-20T12:37:18.783409-04:00',
          'message': '1st Branch Commit',
          'base': 'https://mobi.com/commits#a5f39a5b53dc81d222e7a9f03ec955a378b8bdbd',
          'auxiliary': '',
          'branch': ''
      },
      {
          'id': 'https://mobi.com/commits#a5f39a5b53dc81d222e7a9f03ec955a378b8bdbd',
          'creator': {
              'firstName': '',
              'lastName': '',
              'username': 'admin'
          },
          'date': '2023-04-20T12:36:29.981163-04:00',
          'message': '2nd commit on master',
          'base': 'https://mobi.com/commits#873f68a12e218461779fb9ce446af5823c72e711',
          'auxiliary': '',
          'branch': ''
      },
      {
          'id': 'https://mobi.com/commits#873f68a12e218461779fb9ce446af5823c72e711',
          'creator': {
              'firstName': '',
              'lastName': '',
              'username': 'admin'
          },
          'date': '2023-04-17T09:41:53.351341-04:00',
          'message': 'The initial commit.',
          'base': '',
          'auxiliary': '',
          'branch': ''
      }
    ];
  });
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('setupCommitColumns returns correct data', () => {
    const actualGraphActions: GitAction[] = service.getGraphActions(commits, 'HEAD');
    const expectedGraphActions: GitAction[] = [
      {
        'action': 'create-branch',
        'branch': 'HEAD'
      },
      {
        'action': 'commit',
        'branch': 'HEAD',
        'commit': commits[3],
      },
      {
        'action': 'commit',
        'branch': 'HEAD',
        'commit': commits[2],
      },
      {
        'action': 'create-branch',
        'branch': '1stBranch',
        'atCommit': 'https://mobi.com/commits#a5f39a5b53dc81d222e7a9f03ec955a378b8bdbd'
      },
      {
        'action': 'commit',
        'branch': '1stBranch',
        'commit': commits[1],
      },
      {
        'action': 'merge-commit',
        'branch': '1stBranch',
        'commit': commits[0],
        'mergeTo': 'HEAD'
      }
    ];
    expect(actualGraphActions).toEqual(expectedGraphActions);
  });
  it('setupCommitColumns returns correct data', () => {
    const actualCommitColumns: CommitColumn[] = service.setupCommitColumns(commits, 'HEAD');
    const expectedCommitColumns: any[] = [
      {
        'commitHashes': [
          'https://mobi.com/commits#66b958378f54f1c02129c28c03a3b36259913444',
          'https://mobi.com/commits#a5f39a5b53dc81d222e7a9f03ec955a378b8bdbd',
          'https://mobi.com/commits#873f68a12e218461779fb9ce446af5823c72e711'
        ],
        'branchName': 'HEAD',
        'mergeCommit': false
      },
      {
        'commitHashes': [
          'https://mobi.com/commits#f6db5e0ade198fe9b35b458d2986f418ceacfdf5'
        ],
        'branchName': '1stBranch',
        'mergeCommit': true,
        'startCommitHash': 'https://mobi.com/commits#a5f39a5b53dc81d222e7a9f03ec955a378b8bdbd'
      }
    ];
    expect(actualCommitColumns).toEqual(expectedCommitColumns);
  });
  it('sortActions returns correct data', () => {
    const d63e59587c = {
      'id': 'https://mobi.com/commits#d63e59587c8c1662d620dcd11d10ef6b6db085e2',
      'creator': {
        'firstName': '',
        'lastName': '',
        'username': 'admin'
      },
      'date': '2019-07-16T15:28:10+02:00',
      'message': 'testBranch data from testBranch operation on 2019-07-16T15:28:05+02:00',
      'base': 'https://mobi.com/commits#d3e66df8bbb821359840999e23499c40d6231a86',
      'auxiliary': '',
      'branch': ''
    };
    const d3e66df8bb = {
      'id': 'https://mobi.com/commits#d3e66df8bbb821359840999e23499c40d6231a86',
      'creator': {
        'firstName': '',
        'lastName': '',
        'username': 'admin'
      },
      'date': '2019-07-16T15:28:10+02:00',
      'message': 'The initial commit.',
      'base': '',
      'auxiliary': '',
      'branch': ''
    };
    const ff37c927 = {
      'id': 'https://mobi.com/commits#76ff37c927c99a654c056544b05697d7820d549e',
      'creator': {
        'firstName': '',
        'lastName': '',
        'username': 'admin'
      },
      'date': '2019-07-16T15:47:56+02:00',
      'message': 'Merge of testBranch/1234_5678 into testBranch',
      'base': 'https://mobi.com/commits#d3e66df8bbb821359840999e23499c40d6231a86',
      'auxiliary': 'https://mobi.com/commits#d63e59587c8c1662d620dcd11d10ef6b6db085e2',
      'branch': ''
    };
    const c3ecc7bd52 = {
      'id': 'https://mobi.com/commits#c3ecc7bd5293e8f796d47f8944f2810e566212e5',
      'creator': {
        'firstName': '',
        'lastName': '',
        'username': 'admin'
      },
      'date': '2019-07-16T15:50:37+02:00',
      'message': 'Merge of testBranch into MASTER',
      'base': 'https://mobi.com/commits#d3e66df8bbb821359840999e23499c40d6231a86',
      'auxiliary': 'https://mobi.com/commits#76ff37c927c99a654c056544b05697d7820d549e',
      'branch': ''
    };
    const actualSortActions: GitAction[] = service.sortActions([
      {
        'action': 'create-branch',
        'branch': 'MASTER'
      },
      {
        'action': 'commit',
        'branch': 'testBranch/1234_5678',
        'commit': d63e59587c
      },
      {
        'action': 'commit',
        'branch': 'MASTER',
        'commit': d3e66df8bb
      },
      {
        'action': 'create-branch',
        'branch': 'testBranch',
        'atCommit': 'https://mobi.com/commits#d3e66df8bbb821359840999e23499c40d6231a86'
      },
      {
        'action': 'create-branch',
        'branch': 'testBranch/1234_5678',
        'atCommit': 'https://mobi.com/commits#d3e66df8bbb821359840999e23499c40d6231a86'
      },
      {
        'action': 'merge-commit',
        'branch': 'testBranch/1234_5678',
        'commit': ff37c927,
        'mergeTo': 'testBranch'
      },
      {
        'action': 'create-branch',
        'branch': 'testBranch',
        'atCommit': 'https://mobi.com/commits#76ff37c927c99a654c056544b05697d7820d549e'
      },
      {
        'action': 'create-branch',
        'branch': 'testBranch/2345_6789',
        'atCommit': 'https://mobi.com/commits#76ff37c927c99a654c056544b05697d7820d549e'
      },
      {
        'action': 'merge-commit',
        'branch': 'testBranch',
        'commit': c3ecc7bd52,
        'mergeTo': 'MASTER'
      }
    ]);
    const expectedCommitColumns: GitAction[] = [
      {
        'action': 'create-branch',
        'branch': 'MASTER'
      },
      {
        'action': 'commit',
        'branch': 'MASTER',
        'commit': d3e66df8bb
      },
      {
        'action': 'create-branch',
        'branch': 'testBranch',
        'atCommit': 'https://mobi.com/commits#d3e66df8bbb821359840999e23499c40d6231a86'
      },
      {
        'action': 'create-branch',
        'branch': 'testBranch/1234_5678',
        'atCommit': 'https://mobi.com/commits#d3e66df8bbb821359840999e23499c40d6231a86'
      },
      {
        'action': 'commit',
        'branch': 'testBranch/1234_5678',
        'commit': d63e59587c,
        'sortFlag': false
      },
      {
        'action': 'merge-commit',
        'branch': 'testBranch/1234_5678',
        'commit': ff37c927,
        'mergeTo': 'testBranch'
      },
      {
        'action': 'create-branch',
        'branch': 'testBranch',
        'atCommit': 'https://mobi.com/commits#76ff37c927c99a654c056544b05697d7820d549e'
      },
      {
        'action': 'create-branch',
        'branch': 'testBranch/2345_6789',
        'atCommit': 'https://mobi.com/commits#76ff37c927c99a654c056544b05697d7820d549e'
      },
      {
        'action': 'merge-commit',
        'branch': 'testBranch',
        'commit': c3ecc7bd52,
        'mergeTo': 'MASTER'
      }
    ];
    expect(actualSortActions).toEqual(expectedCommitColumns);
  });
});
