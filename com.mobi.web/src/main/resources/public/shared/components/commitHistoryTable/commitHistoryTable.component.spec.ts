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

import { DebugElement, EventEmitter, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { forEach } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import {
    cleanStylesFromDOM,
    mockCatalogManager,
    mockHttpService,
    mockUtil
} from '../../../../../../test/ts/Shared';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { UserManagerService } from '../../services/userManager.service';
import { CommitInfoOverlayComponent } from '../commitInfoOverlay/commitInfoOverlay.component';
import { ErrorDisplayComponent } from '../errorDisplay/errorDisplay.component';
import { InfoMessageComponent } from '../infoMessage/infoMessage.component';
import { CommitHistoryTableComponent } from './commitHistoryTable.component';

describe('Commit History Table component', function() {
    let component: CommitHistoryTableComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitHistoryTableComponent>;
    let catalogManagerStub;
    let matDialog: jasmine.SpyObj<MatDialog>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                MatDialogModule,
                NoopAnimationsModule
            ],
            declarations: [
                CommitHistoryTableComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(InfoMessageComponent)
            ],
            providers: [
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'catalogManagerService', useClass: mockCatalogManager },
                { provide: 'httpService', useClass: mockHttpService },
                MockProvider(UserManagerService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    })
                }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CommitHistoryTableComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        matDialog = TestBed.get(MatDialog);
        catalogManagerStub = TestBed.get('catalogManagerService');

        this.error = 'error';
        this.commitId = 'commit';
        this.entityId = 'entity';
        this.commit = {
            id: this.commitId,
            creator: {
                username: 'user'
            },
            date: 'somedate',
            message: 'message'
        };
        this.commits = [this.commit];
        this.recordId = 'record';

        component.headTitle = 'title';
        component.commitId = this.commitId;
        component.targetId = this.commitId;
        component.entityId = this.entityId;
        component.recordId = this.recordId;
        spyOn<EventEmitter<JSONLDObject[]>>(component.receiveCommits, 'emit');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogManagerStub = null;
    });

    describe('should initialize with the correct data for', function() {
        it('headTitle', function() {
            expect(component.headTitle).toEqual('title');
        });
        it('commitId', function() {
            expect(component.commitId).toEqual(this.commitId);
        });
        it('targetId', function() {
            expect(component.targetId).toEqual(this.commitId);
        });
        it('entityId', function() {
            expect(component.entityId).toEqual(this.entityId);
        });
        it('recordId', function() {
            expect(component.recordId).toEqual(this.recordId);
        });
    });
    describe('contains the correct html', function() {
        beforeEach(async function() {
            component.commits = this.commits;
            fixture.detectChanges();
            await fixture.whenStable();
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.commit-history-table')).length).toEqual(1);
            expect(element.queryAll(By.css('.wrapper')).length).toEqual(1);
        });
        forEach(['table', 'thead', 'tbody', 'svg'], item => {
            it('with a ' + item, function() {
                expect(element.queryAll(By.css(item)).length).toEqual(1);
            });
        });
        it('with ths', function() {
            expect(element.queryAll(By.css('th')).length).toEqual(4);
        });
        it('with the correct styles based on whether a graph should be shown', async function() {
            const svg = element.queryAll(By.css('svg'))[0].nativeElement;
            expect(getComputedStyle(svg).height).toEqual('0px');
            expect(getComputedStyle(svg).width).toEqual('0px');

            component.showGraph = true;
            fixture.detectChanges();
            await fixture.whenStable();

            expect(getComputedStyle(svg).height).toEqual((component.commits.length * component.circleSpacing + component.deltaY) + 'px');
            expect(getComputedStyle(svg).width).not.toEqual('0px');
        });
        it('depending on whether there is a error', async function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.error = this.error;
            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('depending on whether there are commits', async function() {
            expect(element.queryAll(By.css('info-message')).length).toEqual(0);
            component.commits = [];
            component.error = undefined;
            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.queryAll(By.css('info-message')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('should open the commitInfoOverlay', async function() {
            component.commits = this.commits;
            this.headers = {'has-more-results': 'false'};
            component.openCommitOverlay(this.commitId);
            fixture.detectChanges();
            await fixture.whenStable();
            expect(matDialog.open).toHaveBeenCalledWith(CommitInfoOverlayComponent, {data: {commit: this.commit, ontRecordId: this.recordId}});
        });
        describe('should get the list of commits', function() {
            beforeEach(function() {
                spyOn(component, 'drawGraph');
                spyOn(component, 'reset');
            });
            it('unless a commit has not been passed', async function() {
                catalogManagerStub.getDifference.calls.reset();
                component.commitId = undefined;
                fixture.detectChanges();
                await fixture.whenStable();

                component.getCommits();
                expect(catalogManagerStub.getDifference).not.toHaveBeenCalled();
                expect(component.commits).toEqual([]);
                expect(component.receiveCommits.emit).toHaveBeenCalledWith([]);
            });
            describe('if a commit has been passed', function() {
                describe('successfully', function() {
                    describe('for a specific entity id', function() {
                        beforeEach(function() {
                            catalogManagerStub.getCommitHistory.and.returnValue(Promise.resolve(this.commits));
                        });
                        it('drawing the graph', async function() {
                            component.showGraph = true;
                            component.targetId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, this.entityId, component.id);
                            expect(component.error).toEqual('');
                            expect(component.commits).toEqual(this.commits);
                            expect(component.drawGraph).toHaveBeenCalled();
                        });
                        it('without drawing a graph', async function() {
                            component.showGraph = false;
                            component.targetId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, this.entityId, component.id);
                            expect(component.error).toEqual('');
                            expect(component.commits).toEqual(this.commits);
                            expect(component.drawGraph).not.toHaveBeenCalled();
                        });
                    });
                    describe('for a specific commit id', function() {
                        beforeEach(function() {
                            catalogManagerStub.getCommitHistory.and.returnValue(Promise.resolve(this.commits));
                        });
                        it('drawing the graph', async function() {
                            component.showGraph = true;
                            component.targetId = undefined;
                            component.entityId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, undefined, component.id);
                            expect(component.error).toEqual('');
                            expect(component.receiveCommits.emit).toHaveBeenCalledWith(this.commits);
                            expect(component.commits).toEqual(this.commits);
                            expect(component.drawGraph).toHaveBeenCalled();
                        });
                        it('without drawing a graph', async function() {
                            component.showGraph = false;
                            component.targetId = undefined;
                            component.entityId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, undefined, component.id);
                            expect(component.error).toEqual('');
                            expect(component.receiveCommits.emit).toHaveBeenCalledWith(this.commits);
                            expect(component.commits).toEqual(this.commits);
                            expect(component.drawGraph).not.toHaveBeenCalled();
                        });
                    });
                    describe('for a difference between commits', function() {
                        beforeEach(function() {
                            catalogManagerStub.getCommitHistory.and.returnValue(Promise.resolve(this.commits));
                        });
                        it('drawing the graph', async function() {
                            component.showGraph = true;
                            component.entityId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(this.commitId, this.commitId, undefined, component.id);
                            expect(component.error).toEqual('');
                            expect(component.receiveCommits.emit).toHaveBeenCalledWith(this.commits);
                            expect(component.commits).toEqual(this.commits);
                            expect(component.drawGraph).toHaveBeenCalled();
                        });
                        it('without drawing a graph', async function() {
                            component.showGraph = false;
                            component.entityId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(this.commitId, this.commitId, undefined, component.id);
                            expect(component.error).toEqual('');
                            expect(component.receiveCommits.emit).toHaveBeenCalledWith(this.commits);
                            expect(component.commits).toEqual(this.commits);
                            expect(component.drawGraph).not.toHaveBeenCalled();
                        });
                    });
                });
                describe('unless an error occurs', function() {
                    beforeEach(function() {
                        catalogManagerStub.getCommitHistory.and.returnValue(Promise.reject(this.error));
                    });
                    it('with a graph', async function() {
                        component.showGraph = true;
                        component.targetId = undefined;
                        component.entityId = undefined;
                        await component.getCommits();

                        expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, undefined, component.id);
                        expect(component.error).toEqual(this.error);
                        expect(component.receiveCommits.emit).toHaveBeenCalledWith([]);
                        expect(component.commits).toEqual([]);
                        expect(component.reset).toHaveBeenCalled();
                    });
                    it('with no graph', async function() {
                        component.showGraph = false;
                        component.targetId = undefined;
                        component.entityId = undefined;
                        await component.getCommits();

                        expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(this.commitId, undefined, undefined, component.id);
                        expect(component.error).toEqual(this.error);
                        expect(component.receiveCommits.emit).toHaveBeenCalledWith([]);
                        expect(component.commits).toEqual([]);
                        expect(component.reset).not.toHaveBeenCalled();
                    });
                });
            });
        });
        it('should reset graph variables', function() {
            component.snap = jasmine.createSpyObj('snap', ['clear']);
            component.reset();
            expect(component.deltaX).toEqual(10);
        });
    });
    describe('ngOnChanges triggers when changing the', function() {
        beforeEach(function() {
            spyOn(component, 'getCommits');
        });
        it('commitId', function() {
            component.ngOnChanges({
                commitId: new SimpleChange(null, 'new', true)
            });
            expect(component.getCommits).toHaveBeenCalled();
        });
        it('headTitle', function() {
            component.ngOnChanges({
                headTitle: new SimpleChange(null, 'new', true)
            });
            expect(component.getCommits).toHaveBeenCalled();
        });
        it('targetId', function() {
            component.ngOnChanges({
                targetId: new SimpleChange(null, 'new', true)
            });
            expect(component.getCommits).toHaveBeenCalled();
        });
        it('entityId', function() {
            component.ngOnChanges({
                entityId: new SimpleChange(null, 'new', true)
            });
            expect(component.getCommits).toHaveBeenCalled();
        });
    });
    it('should call openModal for commitInfoOverlay when an id is clicked', async function() {
        component.commits = [this.commit];
        fixture.detectChanges();
        await fixture.whenStable();

        const id = element.queryAll(By.css('table tr td.commit-id a'))[0];
        id.triggerEventHandler('click', null);
        expect(matDialog.open).toHaveBeenCalledWith(CommitInfoOverlayComponent, {data: {commit: this.commit, ontRecordId: this.recordId}});
    });
});
