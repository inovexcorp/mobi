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

import {
    Component,
    DoCheck,
    ElementRef,
    EventEmitter,
    Input,
    IterableDiffer,
    IterableDiffers,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommitInfoOverlayComponent } from '../commitInfoOverlay/commitInfoOverlay.component';
import { v4 } from 'uuid';
import { HttpResponse } from '@angular/common/http';
import { get, find } from 'lodash';
import { first } from 'rxjs/operators';

import { Commit } from '../../models/commit.interface';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { UserManagerService } from '../../services/userManager.service';
import { ProgressSpinnerService } from '../progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { Tag } from '../../models/tag.interface';
import { CATALOG } from '../../../prefixes';
import { getDctermsValue, getPropertyId } from '../../utility';
import { User } from '../../models/user.class';

/**
 * @class shared.CommitHistoryTableComponent
 *
 * A directive that creates a table containing the commit chain of the provided commit. Can optionally also display a
 * SVG graph generated using commit-history-graph component. Clicking on a commit id or its corresponding circle in the graph will open up a
 * {@link shared.CommitInfoOverlayComponent commit info overlay}. Can optionally provide a variable to bind the
 * retrieved commits to. The directive is replaced by the content of the template.
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
    styleUrls: ['./commitHistoryTable.component.scss']
})
export class CommitHistoryTableComponent implements OnInit, OnChanges, OnDestroy, DoCheck {
    @Input() commitId: string;
    @Input() type: string;
    @Input() headTitle?: string;
    @Input() targetId?: string;
    @Input() entityId?: string;
    @Input() recordId: string;
    @Input() tags?: JSONLDObject[];
    @Input() dotClickable: boolean;
    @Input() graph: boolean;
    @Input() branches: JSONLDObject[] = [];
    @Output() receiveCommits = new EventEmitter<Commit[]>();
    @Output() commitDotOnClick = new EventEmitter<Commit>();

    @ViewChild('commitHistoryTable', { static: true }) commitHistoryTable: ElementRef;

    constructor(private cm: CatalogManagerService,
        private spinnerSvc: ProgressSpinnerService,
        public um: UserManagerService,
        private iterableDiffers: IterableDiffers,
        private dialog: MatDialog) {
    }
    error = '';
    catalogId = '';
    commits: Commit[] = [];
    tagObjects: Tag[] = [];
    id = `commit-history-table${v4()}`;
    showGraph: boolean;
    commitDotClickable: boolean;
    tagDiffer: IterableDiffer<JSONLDObject>;

    getUserDisplay: (obj: { firstName: string, lastName: string, username: string}) => string = User.getDisplayName;

    ngOnInit(): void {
        this.tagDiffer = this.iterableDiffers.find([]).create(null);
        this.showGraph = this.graph !== undefined;
        this.commitDotClickable = this.dotClickable !== undefined;
    }

    ngOnChanges(changesObj: SimpleChanges): void {
        if (changesObj?.headTitle || changesObj?.commitId ||
            changesObj?.targetId || changesObj?.entityId || changesObj?.branches || changesObj?.tags) {
            this.getCommits();
            this.getBranches();
            this.getTags();
        }
    }
    ngDoCheck(): void {
        const changes = this.tagDiffer.diff(this.tags);
        if (changes) {
            this.getTags();
        }
    }
    ngOnDestroy(): void {
        this.spinnerSvc.finishLoadingForComponent(this.commitHistoryTable);
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
    commitDotClicked(commit: Commit): void {
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
    getBranches(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
        this.cm.getRecordBranches(this.recordId, this.catalogId).subscribe(response => {
            this.branches = response.body;
            this.error = '';
            this.spinnerSvc.finishLoadingForComponent(this.commitHistoryTable);
        }, errorMessage => {
            this.error = errorMessage;
            this.branches = [];
            this.spinnerSvc.finishLoadingForComponent(this.commitHistoryTable);
        });
    }
    getTags(): void {
        if (this.tags) {
            this.tagObjects = this.tags.map(tag => {
                return {
                    tagIri: tag['@id'],
                    commitIri: getPropertyId(tag, `${CATALOG}commit`),
                    title: getDctermsValue(tag, 'title'),
                    description: getDctermsValue(tag, 'description')
                } as Tag;
            });
        } else {
            this.spinnerSvc.startLoadingForComponent(this.commitHistoryTable, 30);
            this.cm.getRecordVersions(this.recordId, get(this.cm.localCatalog, '@id', '')).pipe(first()).subscribe(
                (response: HttpResponse<JSONLDObject[]>) => {
                    this.tagObjects = response.body.map(tag => {
                        return {
                            tagIri: tag['@id'],
                            commitIri: getPropertyId(tag, `${CATALOG}commit`),
                            title: getDctermsValue(tag, 'title'),
                            description: getDctermsValue(tag, 'description')
                        } as Tag;
                    });
                    this.error = '';
                    this.spinnerSvc.finishLoadingForComponent(this.commitHistoryTable);
                }, errorMessage => {
                    this.error = errorMessage;
                    this.tags = [];
                    this.spinnerSvc.finishLoadingForComponent(this.commitHistoryTable);
                }
            );
        }
    }
    getCommitId(index: number, commit: Commit): string {
        return commit.id;
    }
}
