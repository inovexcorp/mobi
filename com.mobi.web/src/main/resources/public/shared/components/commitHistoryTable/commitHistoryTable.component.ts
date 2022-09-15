/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { find, startsWith, split, forEach, includes, join, map, indexOf, head } from 'lodash';
import { v4 } from 'uuid';
import * as Snap from 'snapsvg';
import * as chroma from 'chroma-js';
import { first } from 'rxjs/operators';

import { Commit } from '../../models/commit.interface';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { UserManagerService } from '../../services/userManager.service';
import { CommitInfoOverlayComponent } from '../commitInfoOverlay/commitInfoOverlay.component';
import { ProgressSpinnerService } from '../progress-spinner/services/progressSpinner.service';
import { UtilService } from '../../services/util.service';

import './commitHistoryTable.component.scss';

/**
 * @class shared.CommitHistoryTableComponent
 *
 * A directive that creates a table containing the commit chain of the provided commit. Can optionally also display a
 * SVG graph generated using Snap.svg showing the network of the commits along with an optional title for the top
 * commit. Clicking on a commit id or its corresponding circle in the graph will open up a
 * {@link shared.CommitInfoOverlayComponent commit info overlay}. Can optionally provide a variable to bind the
 * retrieved commits to. The directive is replaced by the content of the template.
 *
 * @param {string} commitId The IRI string of a commit in the local catalog
 * @param {string} [headTitle=''] headTitle The optional title to put on the top commit
 * @param {string} [targetId=''] targetId limits the commits displayed to only go as far back as this specified
 *      commit.
 * @param {string} [entityId=''] entityId The optional IRI string of an entity whose history is to be displayed
 * @param {string} [recordId=''] recordId The optional IRI string of an OntologyRecord associated with the commit
 * @param {Function} [receiveCommits=undefined] receiveCommits The optional function receive more commits
 * @param {boolean} graph A string that if present, shows graph data of the commits
 */
@Component({
    selector: 'commit-history-table',
    templateUrl: './commitHistoryTable.component.html'
})
export class CommitHistoryTableComponent implements OnInit, OnChanges, OnDestroy {
    @Input() commitId: string;
    @Input() headTitle?: string;
    @Input() targetId?: string;
    @Input() entityId?: string;
    @Input() recordId?: string;
    @Input() graph: boolean;

    @Output() receiveCommits = new EventEmitter<Commit[]>();

    @ViewChild('commitHistoryTable') commitHistoryTable: ElementRef;

    constructor(private util: UtilService, private cm: CatalogManagerService, private um: UserManagerService,
        private dialog: MatDialog, private spinnerSvc: ProgressSpinnerService) {
    }
    
    titleWidth = 75;
    graphCommits = [];
    cols = [];
    wrapper;
    xI = 1;
    colorIdx = 0;
    snap = undefined;
    colors = [];
    limit = 100;
    error = '';
    commit = undefined;
    commits = [];
    circleRadius = 5;
    circleSpacing = 48;
    columnSpacing = 25;
    deltaX = 5 + this.circleRadius;
    deltaY = 56;
    id = 'commit-history-table' + v4();
    showGraph

    ngOnInit(): void {
        this.showGraph = this.graph !== undefined;
        this.colors = chroma.brewer.Set1;
        this.snap = new (<any>Snap).default('.commit-graph');
    }
    ngOnChanges(changesObj: SimpleChanges): void {
        if (changesObj?.headTitle || changesObj?.commitId || changesObj?.targetId || changesObj?.entityId) {
            this.getCommits();
        }
    }
    ngOnDestroy(): void {
        this.spinnerSvc.finishLoadingForComponent(this.commitHistoryTable);
    }
    openCommitOverlay(commitId: string): void {
        this.dialog.open(CommitInfoOverlayComponent, {
            data: {
                commit: find(this.commits, {id: commitId}),
                ontRecordId: this.recordId
            }
        });
    }
    getCommits(): void {
        if (this.commitId) {
            this.spinnerSvc.startLoadingForComponent(this.commitHistoryTable, 30);
            const promise = this.cm.getCommitHistory(this.commitId, this.targetId, this.entityId, true).pipe(first()).toPromise();
            promise.then((commits: Commit[]) => {
                this.receiveCommits.emit(commits);
                this.commits = commits;
                this.error = '';
                if (this.showGraph) {
                    this.drawGraph();
                }
                this.spinnerSvc.finishLoadingForComponent(this.commitHistoryTable);
            }, errorMessage => {
                this.error = errorMessage;
                this.commits = [];
                this.receiveCommits.emit([]);
                if (this.showGraph) {
                    this.reset();
                }
                this.spinnerSvc.finishLoadingForComponent(this.commitHistoryTable);
            });
        } else {
            this.commits = [];
            this.receiveCommits.emit([]);
            if (this.showGraph) {
                this.reset();
            }
        }
    }
    drawGraph(): void {
        this.reset();
        if (this.commits.length > 0) {
            this.wrapper = this.snap.group();
            // First draw circles in a straight line
            forEach(this.commits, (commit, index : number) => {
                const circle = this.snap.circle(0, this.circleSpacing/2 + (index * this.circleSpacing), this.circleRadius);
                const title = Snap.parse('<title>' + this.util.condenseCommitId(commit.id) + '</title>');
                circle.append(title);
                circle.click(() => this.openCommitOverlay(commit.id));
                this.wrapper.add(circle);
                this.graphCommits.push({commit: commit, circle: circle});
            });
            // Set up head commit and begin recursion
            const c = this.graphCommits[0];
            const color = this.colors[this.colorIdx % this.colors.length];
            this.colorIdx++;
            c.circle.attr({fill: color});
            this.cols.push({x: 0, commits: [c.commit.id], color: color});
            if (this.headTitle) {
                this.drawHeadTitle(c.circle);
            }
            this.recurse(c);
            // Update deltaX based on how many columns there are or the minimum width
            this.deltaX = Math.max(this.deltaX + this.xI * this.columnSpacing, this.titleWidth + 10 + this.circleRadius);
            // Shift the x and y coordinates of everything using deltaX and deltaY
            forEach(this.graphCommits, (c) => c.circle.attr({cx: c.circle.asPX('cx') + this.deltaX, cy: c.circle.asPX('cy') + this.deltaY}));
            forEach(this.wrapper.selectAll('path'), path => {
                const points = map(split(path.attr('d'), ' '), s => {
                    let sections;
                    let headStr;
                    if (startsWith(s, 'M') || startsWith(s, 'C') || startsWith(s, 'L')) {
                        headStr = head(s);
                        sections = split(s.substring(1), ',');
                    } else {
                        headStr = '';
                        sections = split(s, ',');
                    }
                    sections[0] = '' + (parseFloat(sections[0]) + this.deltaX);
                    sections[1] = '' + (parseFloat(sections[1]) + this.deltaY);
                    return headStr + join(sections, ',');
                });
                path.attr({d: join(points, ' ')});
            });
            forEach(this.wrapper.selectAll('rect'), rect => rect.attr({x: rect.asPX('x') + this.deltaX, y: rect.asPX('y') + this.deltaY}));
            forEach(this.wrapper.selectAll('text'), text => text.attr({x: text.asPX('x') + this.deltaX, y: text.asPX('y') + this.deltaY}));
        }
    }
    reset(): void {
        this.graphCommits = [];
        this.cols = [];
        this.xI = 1;
        this.colorIdx = 0;
        this.snap.clear();
        this.snap = new (<any>Snap).default('.commit-graph');
        this.wrapper = undefined;
        this.deltaX = 5 + this.circleRadius;
    }
    getCommitId(index: number, commit: Commit): string {
        return commit.id;
    }

    private recurse(c): void {
        // Find the column this commit belongs to and the ids of its base and auxiliary commits
        const col = find(this.cols, col => includes(col.commits, c.commit.id));
        const baseParent = c.commit.base;
        const auxParent = c.commit.auxiliary;
        // If there is an auxiliary parent, there is also a base parent
        if (auxParent) {
            // Determine whether the base parent is already in a column
            const baseC = find(this.graphCommits, {commit: {id: baseParent}});
            const baseCol = find(this.cols, col => includes(col.commits, baseParent));
            if (!baseCol) {
                // If not in a column, shift the base parent to be beneath the commit
                baseC.circle.attr({cx: col.x, fill: col.color});
                col.commits.push(baseParent);
            }
            // Draw a line between commit and base parent
            this.drawLine(c, baseC, col.color);
            // Determine whether auxiliary parent is already in a column
            const auxC = find(this.graphCommits, {commit: {id: auxParent}});
            const auxCol = find(this.cols, col => includes(col.commits, auxParent));
            let auxColor;
            if (auxCol) {
                // If in a column, collect line color
                auxColor = auxCol.color;
            } else {
                // If not in a column, shift the auxiliary parent to the left in new column and collect line color
                auxColor = this.colors[this.colorIdx % this.colors.length];
                this.colorIdx++;
                auxC.circle.attr({cx: -this.columnSpacing * this.xI, fill: auxColor});
                this.cols.push({x: -this.columnSpacing * this.xI, commits: [auxParent], color: auxColor});
                this.xI++;
            }
            // Draw a line between commit and auxiliary parent
            this.drawLine(c, auxC, auxColor);
            // Recurse on right only if it wasn't in a column to begin with
            if (!baseCol) {
                this.recurse(baseC);
            }
            // Recurse on left only if it wasn't in a column to begin with
            if (!auxCol) {
                this.recurse(auxC);
            }
        } else if (baseParent) {
            // Determine whether the base parent is already in a column
            const baseC = find(this.graphCommits, {commit: {id: baseParent}});
            const baseCol = find(this.cols, col => includes(col.commits, baseParent));
            if (!baseCol) {
                // If not in a column, push into current column and draw a line between them
                baseC.circle.attr({cx: col.x, fill: col.color});
                col.commits.push(baseParent);
                this.drawLine(c, baseC, col.color);
                // Continue recursion
                this.recurse(baseC);
            } else {
                // If in a column, draw a line between them and end this branch of recusion
                this.drawLine(c, baseC, col.color);
            }
        }
    }
    private drawLine(c, parentC, color): void {
        const start = {x: c.circle.asPX('cx'), y: c.circle.asPX('cy')};
        const end = {x: parentC.circle.asPX('cx'), y: parentC.circle.asPX('cy')};
        let pathStr = 'M' + start.x + ',' + (start.y + this.circleRadius);
        if (start.x > end.x) {
            // If the starting commit is further right than the ending commit, curve first then go straight down
            pathStr += ' C' + start.x + ',' + (start.y + 3 * this.circleSpacing/4) + ' ' + end.x + ',' + (start.y + this.circleSpacing/4) + ' '
                + end.x + ',' + (Math.min(start.y + this.circleSpacing, end.y - this.circleRadius)) + ' L';
        } else if (start.x < end.x) {
            // If the starting commit is further left than the ending commmit, check if there are any commits in between in the same column
            // as the starting commit
            const inBetweenCommits = this.graphCommits.slice(indexOf(this.graphCommits, c) + 1, indexOf(this.graphCommits, parentC));
            if (find(inBetweenCommits, commit => commit.circle.asPX('cx') === start.x)) {
                // If there is a commit in the way, curve first then go straight down
                pathStr += ' C' + start.x + ',' + (start.y + 3 * this.circleSpacing/4) + ' ' + end.x + ',' + (start.y + this.circleSpacing/4) + ' '
                    + end.x + ',' + (start.y + this.circleSpacing) + ' L';
            } else {
                // If there isn't a commit in the way, go straight down then curve
                pathStr += ' L' + start.x + ',' + (Math.max(end.y - this.circleSpacing, start.y + this.circleRadius)) + ' C' + start.x + ',' + (end.y - this.circleSpacing/4) + ' '
                    + end.x + ',' + (end.y - 3 * this.circleSpacing/4) + ' ';
            }
        } else {
            // If the starting and ending commits are in the same column, go straight down
            pathStr += ' L';
        }
        pathStr += end.x + ',' + (end.y - this.circleRadius);
        const path = this.snap.path(pathStr);
        path.attr({
            fill: 'none',
            'stroke-width': 2,
            stroke: color
        });
        this.wrapper.add(path);
    }
    private drawHeadTitle(circle): void {
        const cx = circle.asPX('cx'),
            cy = circle.asPX('cy'),
            r = circle.asPX('r');
        const rect = this.snap.rect(cx - r - this.titleWidth - 5, cy - r - 5, this.titleWidth, 20, 5, 5);
        rect.attr({
            'fill-opacity': '0.5'
        });
        const triangle = this.snap.path('M' + (cx - r - 5) + ',' + (cy - r) + ' L' + (cx - r) + ',' + cy + ' L' + (cx - r - 5) + ',' + (cy + r));
        triangle.attr({
            'fill-opacity': '0.5'
        });
        let displayText = this.headTitle;
        const title = Snap.parse('<title>' + displayText + '</title>');
        const text = this.snap.text(rect.asPX('x') + (rect.asPX('width'))/2, rect.asPX('y') + (rect.asPX('height')/2), displayText);
        text.attr({
            'text-anchor': 'middle',
            'alignment-baseline': 'central',
            fill: '#fff'
        });
        while (text.getBBox().width > rect.asPX('width') - 5) {
            displayText = displayText.slice(0, -1);
            text.node.innerHTML = displayText + '...';
        }
        text.append(title);
        this.wrapper.add(rect, triangle, text);
    }
}
