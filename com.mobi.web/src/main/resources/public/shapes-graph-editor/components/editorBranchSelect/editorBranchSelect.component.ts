/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import './editorBranchSelect.component.scss';

interface OptionGroup {
    title: string,
    icon: string,
    options: string[]
}

/**
 * @class shape-graph-editor.EditorBranchSelectComponent
 *
 * `editor-branch-select` is a component that provides a `mat-select` for choosing what branch to view.
 */
@Component({
    selector: 'editor-branch-select',
    templateUrl: './editorBranchSelect.component.html'
})
export class EditorBranchSelectComponent implements OnInit {
    branchSearchControl: FormControl = new FormControl();
   
    branches = [
        'MASTER',
        'Branch A',
        'Branch B'
    ];

    tags = [
        'Tag A',
        'Tag B'
    ];

    commits = [];

    filteredOptions: Observable<OptionGroup[]>

    constructor() {}

    ngOnInit(): void {
        this.filteredOptions = this.branchSearchControl.valueChanges
            .pipe(
                startWith(''),
                map(val => this.filter(val))
            );
    }

    filter(val: string): OptionGroup[] {
        const filteredBranches = this.branches.filter(option => option.toLowerCase().indexOf(val.toLowerCase()) === 0);
        const rtn = [{ title: 'Branches', icon: 'code-fork',  options: filteredBranches }];
        if (this.tags.length > 0) {
            const filteredTags = this.tags.filter(option => option.toLowerCase().indexOf(val.toLowerCase()) === 0);
            rtn.push({ title: 'Tags', icon: 'tag', options: filteredTags });
        }
        if (this.commits.length > 0) {
            const filteredCommits = this.commits.filter(option => option.toLowerCase().indexOf(val.toLowerCase()) === 0);
            rtn.push({ title: 'Commits', icon: 'code-commit', options: filteredCommits });
        }
        return rtn;
    }

    selectBranch(event: MatAutocompleteSelectedEvent): void {
        // TODO: Handle select
    }
}
