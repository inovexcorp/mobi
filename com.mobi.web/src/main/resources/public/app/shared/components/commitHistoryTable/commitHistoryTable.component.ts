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
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    IterableDiffer,
    IterableDiffers,
    KeyValueChangeRecord,
    KeyValueDiffer,
    KeyValueDiffers,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { v4 } from 'uuid';

import { first } from 'rxjs/operators';

import { Commit } from '../../models/commit.interface';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { UserManagerService } from '../../services/userManager.service';
import { ProgressSpinnerService } from '../progress-spinner/services/progressSpinner.service';
import { UtilService } from '../../services/util.service';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { OntologyStateService } from '../../services/ontologyState.service';
import { isEqual } from 'lodash';

/**
 * @class shared.CommitHistoryTableComponent
 *
 * A directive that creates a table containing the commit chain of the provided commit. Can optionally also display a
 * SVG graph generated using commit-history-graph component
 *
 * @param {string} commitId The IRI string of a commit in the local catalog
 * @param {string} [headTitle=''] headTitle The optional title to put on the top commit
 * @param {string} [targetId=''] targetId limits the commits displayed to only go as far back as this specified
 *      commit.
 * @param {string} [entityId=''] entityId The optional IRI string of an entity whose history is to be displayed
 * @param {string} [recordId=''] recordId The optional IRI string of an OntologyRecord associated with the commit
 * @param {string} [dotText=''] dotText The optional dot text for commit
 * @param {EventEmitter} [receiveCommits=undefined] receiveCommits The optional function receive more commits
 * @param {EventEmitter} [commitDotOnClick] commitDotOnClick The optional function, occurs on commit onClick event
 * @param {boolean} graph A string that if present, shows graph data of the commits
 */
@Component({
    selector: 'commit-history-table',
    templateUrl: './commitHistoryTable.component.html',
    styleUrls: ['./commitHistoryTable.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommitHistoryTableComponent implements OnInit, OnChanges, OnDestroy {
    private differ: KeyValueDiffer<string, any>;
    
    @Input() commitId: string;
    @Input() headTitle?: string;
    @Input() targetId?: string;
    @Input() entityId?: string;
    @Input() recordId?: string;
    @Input() dotClickable: boolean;
    @Input() graph: boolean;
    @Input() branches: JSONLDObject[] = [];
    @Output() receiveCommits = new EventEmitter<Commit[]>();
    @Output() commitDotOnClick = new EventEmitter<Commit>();

    @ViewChild('commitHistoryTable', { static: true }) commitHistoryTable: ElementRef;

    constructor(public util: UtilService,
        private cm: CatalogManagerService,
        private spinnerSvc: ProgressSpinnerService,
        private differsService: KeyValueDiffers,
        private os: OntologyStateService,
        private _cf: ChangeDetectorRef,
        public um: UserManagerService) {
    }
    error = '';
    commits: Commit[] = [];
    id = 'commit-history-table' + v4();
    showGraph: boolean;
    commitDotClickable: boolean;

    ngOnInit(): void {
        this.showGraph = this.graph !== undefined;
        this.commitDotClickable = this.dotClickable !== undefined;
        const obj = {
            headTitle: undefined,
            commitId: undefined,
            targetId: undefined,
            entityId: undefined,
            branches: undefined
        };
        this.differ =  this.differsService.find(obj).create();
        this.os.branchRecordAction$.subscribe( val => {
            this.branches = val;
        });
    }
    
    ngOnChanges(changesObj: SimpleChanges): void {
        if (changesObj?.headTitle || changesObj?.commitId || 
            changesObj?.targetId || changesObj?.entityId || changesObj?.branches) {
            this.getCommits();
        }
    }
    ngDoCheck(): void {
        if (this.differ) {
            const self = this;
            const values = {
                headTitle: self.headTitle,
                commitId: self.commitId,
                targetId: self.targetId,
                entityId: self.entityId,
                branches: self.branches
            };
            const changes = this.differ.diff({...values}); // Comparison occur by Object.is()
            if (changes) {
                let isDifferent = false;
                changes.forEachItem((changeRecord: KeyValueChangeRecord<string, any>) => {
                    const isValueEqual = isEqual(changeRecord.previousValue, changeRecord.currentValue);
                    if (!isValueEqual){
                        isDifferent = true;
                    }
                });
                if (isDifferent) {
                    this.getCommits();
                    this._cf.markForCheck();
                }
            }
        }
       
    }
    ngOnDestroy(): void {
        this.spinnerSvc.finishLoadingForComponent(this.commitHistoryTable);
    }
    commitDotClicked(commit): void {
        this.commitDotOnClick.emit(commit);
    }
    getCommits(): void {
        if (this.commitId) {
            this.spinnerSvc.startLoadingForComponent(this.commitHistoryTable, 30);
            this.cm.getCommitHistory(this.commitId, this.targetId, this.entityId, true).pipe(first()).subscribe(
                (commits: Commit[]) => {
                    this.receiveCommits.emit(commits);
                    this.commits = commits;
                    this.error = '';
                    this.spinnerSvc.finishLoadingForComponent(this.commitHistoryTable);
                }, errorMessage => {
                    this.receiveCommits.emit([]);
                    this.error = errorMessage;
                    this.commits = [];
                    this.spinnerSvc.finishLoadingForComponent(this.commitHistoryTable);
                }
            );
        } else {
            this.commits = [];
            this.receiveCommits.emit([]);
        }
    }
    
    getCommitId(index: number, commit: Commit): string {
        return commit.id;
    }
}
