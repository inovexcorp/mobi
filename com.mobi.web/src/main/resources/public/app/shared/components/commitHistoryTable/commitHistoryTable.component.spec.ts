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

import { DebugElement, EventEmitter, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { forEach } from 'lodash';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { Commit } from '../../models/commit.interface';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { UserManagerService } from '../../services/userManager.service';
import { UtilService } from '../../services/util.service';
import { CommitInfoOverlayComponent } from '../commitInfoOverlay/commitInfoOverlay.component';
import { ErrorDisplayComponent } from '../errorDisplay/errorDisplay.component';
import { InfoMessageComponent } from '../infoMessage/infoMessage.component';
import { ProgressSpinnerService } from '../progress-spinner/services/progressSpinner.service';
import { CommitHistoryTableComponent } from './commitHistoryTable.component';

describe('Commit History Table component', function() {
    let component: CommitHistoryTableComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitHistoryTableComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    const testData: any =  {};

    beforeEach(async () => {
        await TestBed.configureTestingModule({
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
                MockProvider(CatalogManagerService),
                MockProvider(ProgressSpinnerService),
                MockProvider(UserManagerService),
                MockProvider(UtilService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    })
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CommitHistoryTableComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;

        testData.error = 'error';
        testData.commitId = 'commit';
        testData.entityId = 'entity';
        testData.commit = {
            id: testData.commitId,
            creator: {
                username: 'user'
            },
            date: 'somedate',
            message: 'message'
        };
        testData.commits = [testData.commit];
        testData.recordId = 'record';

        component.headTitle = 'title';
        component.commitId = testData.commitId;
        component.targetId = testData.commitId;
        component.entityId = testData.entityId;
        component.recordId = testData.recordId;
        spyOn<EventEmitter<Commit[]>>(component.receiveCommits, 'emit');
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
            expect(component.commitId).toEqual(testData.commitId);
        });
        it('targetId', async () => { 
            fixture.detectChanges();
            await fixture.whenStable();
            expect(component.targetId).toEqual(testData.commitId);
        });
        it('entityId', function() {
            expect(component.entityId).toEqual(testData.entityId);
        });
        it('recordId', async () => {
            fixture.detectChanges();
            await fixture.whenStable();
            expect(component.recordId).toEqual(testData.recordId);
        });
    });
    describe('contains the correct html', function() {
        beforeEach(async function() {
            component.commits = testData.commits;
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
            component.error = testData.error;
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
            component.commits = testData.commits;
            testData.headers = {'has-more-results': 'false'};
            component.openCommitOverlay(testData.commitId);
            fixture.detectChanges();
            await fixture.whenStable();
            expect(matDialog.open).toHaveBeenCalledWith(CommitInfoOverlayComponent, {
                data: { commit: testData.commit, ontRecordId: testData.recordId }
            });
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
                            catalogManagerStub.getCommitHistory.and.returnValue(of(testData.commits));
                        });
                        it('drawing the graph', async function() {
                            component.showGraph = true;
                            component.targetId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(testData.commitId, undefined, testData.entityId, true);
                            expect(component.error).toEqual('');
                            expect(component.commits).toEqual(testData.commits);
                            expect(component.drawGraph).toHaveBeenCalledWith();
                        });
                        it('without drawing a graph', async function() {
                            component.showGraph = false;
                            component.targetId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(testData.commitId, undefined, testData.entityId, true);
                            expect(component.error).toEqual('');
                            expect(component.commits).toEqual(testData.commits);
                            expect(component.drawGraph).not.toHaveBeenCalled();
                        });
                    });
                    describe('for a specific commit id', function() {
                        beforeEach(function() {
                            catalogManagerStub.getCommitHistory.and.returnValue(of(testData.commits));
                        });
                        it('drawing the graph', async function() {
                            component.showGraph = true;
                            component.targetId = undefined;
                            component.entityId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(testData.commitId, undefined, undefined, true);
                            expect(component.error).toEqual('');
                            expect(component.receiveCommits.emit).toHaveBeenCalledWith(testData.commits);
                            expect(component.commits).toEqual(testData.commits);
                            expect(component.drawGraph).toHaveBeenCalledWith();
                        });
                        it('without drawing a graph', async function() {
                            component.showGraph = false;
                            component.targetId = undefined;
                            component.entityId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(testData.commitId, undefined, undefined, true);
                            expect(component.error).toEqual('');
                            expect(component.receiveCommits.emit).toHaveBeenCalledWith(testData.commits);
                            expect(component.commits).toEqual(testData.commits);
                            expect(component.drawGraph).not.toHaveBeenCalled();
                        });
                    });
                    describe('for a difference between commits', function() {
                        beforeEach(function() {
                            catalogManagerStub.getCommitHistory.and.returnValue(of(testData.commits));
                        });
                        it('drawing the graph', async function() {
                            component.showGraph = true;
                            component.entityId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(testData.commitId, testData.commitId, undefined, true);
                            expect(component.error).toEqual('');
                            expect(component.receiveCommits.emit).toHaveBeenCalledWith(testData.commits);
                            expect(component.commits).toEqual(testData.commits);
                            expect(component.drawGraph).toHaveBeenCalledWith();
                        });
                        it('without drawing a graph', async function() {
                            component.showGraph = false;
                            component.entityId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(testData.commitId, testData.commitId, undefined, true);
                            expect(component.error).toEqual('');
                            expect(component.receiveCommits.emit).toHaveBeenCalledWith(testData.commits);
                            expect(component.commits).toEqual(testData.commits);
                            expect(component.drawGraph).not.toHaveBeenCalled();
                        });
                    });
                });
                describe('unless an error occurs', function() {
                    beforeEach(function() {
                        catalogManagerStub.getCommitHistory.and.returnValue(throwError(testData.error));
                    });
                    it('with a graph', async function() {
                        component.showGraph = true;
                        component.targetId = undefined;
                        component.entityId = undefined;
                        await component.getCommits();

                        expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(testData.commitId, undefined, undefined, true);
                        expect(component.error).toEqual(testData.error);
                        expect(component.receiveCommits.emit).toHaveBeenCalledWith([]);
                        expect(component.commits).toEqual([]);
                        expect(component.reset).toHaveBeenCalledWith();
                    });
                    it('with no graph', async function() {
                        component.showGraph = false;
                        component.targetId = undefined;
                        component.entityId = undefined;
                        await component.getCommits();

                        expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(testData.commitId, undefined, undefined, true);
                        expect(component.error).toEqual(testData.error);
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
            expect(component.getCommits).toHaveBeenCalledWith();
        });
        it('headTitle', function() {
            component.ngOnChanges({
                headTitle: new SimpleChange(null, 'new', true)
            });
            expect(component.getCommits).toHaveBeenCalledWith();
        });
        it('targetId', function() {
            component.ngOnChanges({
                targetId: new SimpleChange(null, 'new', true)
            });
            expect(component.getCommits).toHaveBeenCalledWith();
        });
        it('entityId', function() {
            component.ngOnChanges({
                entityId: new SimpleChange(null, 'new', true)
            });
            expect(component.getCommits).toHaveBeenCalledWith();
        });
    });
    it('should call openModal for commitInfoOverlay when an id is clicked', async function() {
        component.commits = [testData.commit];
        fixture.detectChanges();
        await fixture.whenStable();

        const id = element.queryAll(By.css('table tr td.commit-id a'))[0];
        id.triggerEventHandler('click', null);
        expect(matDialog.open).toHaveBeenCalledWith(CommitInfoOverlayComponent, {data: {commit: testData.commit, ontRecordId: testData.recordId}});
    });
});