/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { Commit } from './commit.interface';
import { Conflict } from './conflict.interface';
import { Difference } from './difference.class';
import { JSONLDObject } from './JSONLDObject.interface';

export class VersionedRdfListItem {
    active: boolean;
    masterBranchIri: string;
    upToDate: boolean;
    userBranch: boolean;
    userCanModify: boolean;
    userCanModifyMaster: boolean;
    versionedRdfRecord: {
        title: string,
        recordId: string,
        branchId?: string,
        commitId: string,
        tagId?: string
    };
    additions: JSONLDObject[];
    deletions: JSONLDObject[];
    branches: JSONLDObject[];
    inProgressCommit: Difference;
    merge: {
        active: boolean,
        target: JSONLDObject,
        checkbox: boolean,
        difference: Difference,
        conflicts: Conflict[],
        resolutions: Difference
        startIndex: number
    }
    selectedCommit?: Commit
    tags: JSONLDObject[]

    constructor() {
        this.active = true;
        this.masterBranchIri = '';
        this.upToDate = true;
        this.userBranch = false;
        this.userCanModify = false;
        this.userCanModifyMaster = false;
        this.versionedRdfRecord = {
            title: '',
            recordId: '',
            branchId: '',
            commitId: ''
        };
        this.branches = [];
        this.additions = [];
        this.deletions = [];
        this.inProgressCommit = new Difference();
        this.merge = {
            active: false,
            target: undefined,
            checkbox: false,
            difference: undefined,
            conflicts: [],
            resolutions: new Difference(),
            startIndex: 0
        };
        this.selectedCommit = undefined;
        this.tags = [];
    }
}
