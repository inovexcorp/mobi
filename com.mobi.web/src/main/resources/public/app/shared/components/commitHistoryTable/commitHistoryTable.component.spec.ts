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

import { DebugElement, EventEmitter, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommitInfoOverlayComponent } from '../commitInfoOverlay/commitInfoOverlay.component';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { forEach } from 'lodash';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { CommitHistoryGraphComponent } from '../../../history-graph/components/commit-history-graph/commit-history-graph.component';
import { Commit } from '../../models/commit.interface';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { UserManagerService } from '../../services/userManager.service';
import { ErrorDisplayComponent } from '../errorDisplay/errorDisplay.component';
import { InfoMessageComponent } from '../infoMessage/infoMessage.component';
import { ProgressSpinnerService } from '../progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { Tag } from '../../models/tag.interface';
import { CATALOG, DCTERMS, ONTOLOGYEDITOR } from '../../../prefixes';
import { CommitHistoryTableComponent } from './commitHistoryTable.component';

describe('Commit History Table component', function() {
    let component: CommitHistoryTableComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitHistoryTableComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let testData: {
      error?: string,
      commitId?: string,
      entityId?: string,
      commit?: Commit,
      commits?: Commit[],
      recordId?: string,
      type?: string,
      tags?: JSONLDObject[],
      branches?: JSONLDObject[],
      headers?: { [key: string]: string }
    } = {};

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                MatDialogModule,
                NoopAnimationsModule
            ],
            declarations: [
                CommitHistoryTableComponent,
                MockComponent(CommitHistoryGraphComponent),
                MockComponent(ErrorDisplayComponent),
                MockComponent(InfoMessageComponent)
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(ProgressSpinnerService),
                MockProvider(UserManagerService),
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
        catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse({body: []})));

        const commitId = 'commitId';
        const commit: Commit = {
            id: commitId,
            condensedId: commitId,
            creator: {
                username: 'user',
                firstName: 'firstName',
                lastName: 'lastName'
            },
            date: 'somedate',
            dateObj: new Date(),
            message: 'message',
            base: 'baseHash',
            auxiliary: 'auxiliaryHash'
        };
        const tag: JSONLDObject = {
            '@id': 'urn:tagId'
        };
        const branches: JSONLDObject[] = [{
            '@id': '',
            '@type': [],
            [`${DCTERMS}title`]: [{ '@value': 'title' }],
            [`${DCTERMS}description`]: [{ '@value': 'description' }],
            [`${DCTERMS}modified`]: [{ '@value': '2023-01-01T00:00:00Z' }],
            [`${CATALOG}head`]: [{ '@id': 'commitId' }]
        }];

        testData = {
            error: 'error',
            commitId: commitId,
            entityId: 'entity',
            commit: commit,
            commits: [commit],
            recordId: 'record',
            type: `${ONTOLOGYEDITOR}OntologyRecord`,
            branches : branches,
            tags: [tag]
        };
        component.headTitle = 'title';
        component.commitId = testData.commitId;
        component.targetId = testData.commitId;
        component.entityId = testData.entityId;
        component.recordId = testData.recordId;
        component.type = testData.type;
        component.tags = testData.tags;
        component.branches = testData.branches;
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
    describe('contains the correct html showgraph', function() {
        beforeEach(async function() {
            component.graph = true;
            component.showGraph = true;
            component.commits = testData.commits;
            fixture.detectChanges();
            await fixture.whenStable();
        });
        forEach(['table', 'thead', 'tbody'], item => {
            it('not with a ' + item, function() {
                expect(element.queryAll(By.css(item)).length).withContext(`${item} should not present`).toEqual(0);
            });
        });
        forEach(['commit-history-graph'], item => {
            it('with a ' + item, function() {
                expect(element.queryAll(By.css(item)).length).withContext(`${item} should present`).toEqual(1);
            });
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
        forEach(['table', 'thead', 'tbody'], item => {
            it('with a ' + item, function() {
                expect(element.queryAll(By.css(item)).length).withContext(`${item} should present`).toEqual(1);
            });
        });
        forEach(['commit-history-graph'], item => {
            it('not with a ' + item, function() {
                expect(element.queryAll(By.css(item)).length).withContext(`${item} should not present`).toEqual(0);
            });
        });
        it('with ths', function() {
            expect(element.queryAll(By.css('th')).length).toEqual(4);
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
            component.error = '';
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
                data: { commit: testData.commit, ontRecordId: testData.recordId, type: testData.type }
            });
        });
        describe('should get the list of commits', function() {
            it('unless a commit has not been passed', async function() {
                catalogManagerStub.getDifference.calls.reset();
                component.commitId = '';
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
                        });
                        it('without drawing a graph', async function() {
                            component.showGraph = false;
                            component.targetId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(testData.commitId, undefined, testData.entityId, true);
                            expect(component.error).toEqual('');
                            expect(component.commits).toEqual(testData.commits);
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
                        });
                        it('without drawing a graph', async function() {
                            component.showGraph = false;
                            component.entityId = undefined;
                            await component.getCommits();

                            expect(catalogManagerStub.getCommitHistory).toHaveBeenCalledWith(testData.commitId, testData.commitId, undefined, true);
                            expect(component.error).toEqual('');
                            expect(component.receiveCommits.emit).toHaveBeenCalledWith(testData.commits);
                            expect(component.commits).toEqual(testData.commits);
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
                    });
                });
            });
        });
        describe('should get the list of Tags', function() {
            beforeEach(function() {
                component.tags = undefined;
            });
            describe('unless Tags have not been passed and a record is', function() {
                describe('provided and tags are retrieved', function() {
                    beforeEach(function() {
                       component.recordId = 'urn:record';
                    });
                    it('successfully', async function() {
                        catalogManagerStub.getRecordVersions.and.returnValue(of(new HttpResponse({body: [{
                            '@id': 'urn:tagId',
                            [`${DCTERMS}title`]: [{ '@value': 'title' }],
                            [`${DCTERMS}description`]: [{ '@value': 'description' }],
                            [`${CATALOG}commit`]: [{ '@id': 'commitId' }],
                        }]})));
                        await component.getTags();

                        expect(catalogManagerStub.getRecordVersions).toHaveBeenCalledWith('urn:record', '');
                        expect(component.error).toEqual('');
                        const tag: Tag = {
                            tagIri: 'urn:tagId',
                            commitIri: 'commitId',
                            title: 'title',
                            description: 'description'
                        };
                        expect(component.tagObjects).toEqual([tag]);
                    });
                    it('unless an error occurs', async function() {
                        catalogManagerStub.getRecordVersions.and.returnValue(throwError(testData.error));
                        await component.getTags();

                        expect(catalogManagerStub.getRecordVersions).toHaveBeenCalledWith('urn:record', '');
                        expect(component.error).toEqual(testData.error);
                        expect(component.tagObjects).toEqual([]);
                    });
                });
                it('not provided', async function() {
                    catalogManagerStub.getRecordVersions.calls.reset();
                    component.tags = undefined;
                    component.recordId = undefined;
                    fixture.detectChanges();
                    await fixture.whenStable();

                    component.getTags();
                    expect(catalogManagerStub.getRecordVersions).not.toHaveBeenCalled();
                    expect(component.tagObjects).toEqual([]);
                });
            });
            it('if Tags have been passed', async function() {
                catalogManagerStub.getRecordVersions.calls.reset();
                component.tags = [{
                    '@id': 'urn:tagId',
                    [`${DCTERMS}title`]: [{ '@value': 'title' }],
                    [`${DCTERMS}description`]: [{ '@value': 'description' }],
                    [`${CATALOG}commit`]: [{ '@id': 'commitId' }],
                }];
                component.recordId = undefined;
                fixture.detectChanges();
                await fixture.whenStable();

                expect(catalogManagerStub.getRecordVersions).not.toHaveBeenCalled();
                const tag: Tag = {
                    tagIri: 'urn:tagId',
                    commitIri: 'commitId',
                    title: 'title',
                    description: 'description'
                };
                expect(component.tagObjects).toEqual([tag]);
            });
        });
    });
    describe('should get the list of branch', function() {
        beforeEach(function() {
            component.branches = undefined;
        });
        describe('If Branches has been updated', function() {
            describe('branches are retrieved', function() {
                beforeEach(function() {
                    component.recordId = 'urn:record';
                    component.catalogId = '';
                });
                it('successfully', async function() {
                    catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse({body: [{
                            '@id': 'urn:catalogId',
                            '@type': [],
                            [`${DCTERMS}title`]: [{ '@value': 'title' }],
                            [`${DCTERMS}description`]: [{ '@value': 'description' }],
                            [`${DCTERMS}modified`]: [{ '@value': '2023-01-01T00:00:00Z' }],
                            [`${CATALOG}head`]: [{ '@id': 'commitId' }]
                        }]})));
                    await component.getBranches();

                    expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith('urn:record', '');
                    expect(component.error).toEqual('');
                    const branch: JSONLDObject  = {
                        '@id': 'urn:catalogId',
                        '@type': [],
                        'http://purl.org/dc/terms/title': [{'@value': 'title'}],
                        'http://purl.org/dc/terms/description': [{'@value': 'description'}],
                        'http://purl.org/dc/terms/modified': [{'@value': '2023-01-01T00:00:00Z'}],
                        'http://mobi.com/ontologies/catalog#head': [{'@id': 'commitId'}]
                    };
                    expect(component.branches).toEqual([branch]);
                });
                it('unless an error occurs', async function() {
                    catalogManagerStub.getRecordBranches.and.returnValue(throwError(testData.error));
                    await component.getBranches();

                    expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith('urn:record', '');
                    expect(component.error).toEqual(testData.error);
                    expect(component.branches).toEqual([]);
                });
            });
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
        it('branches', function() {
            component.ngOnChanges({
                branches: new SimpleChange(null, 'new', true)
            });
            expect(component.getCommits).toHaveBeenCalledWith();
        });
        it('should call openModal for commitInfoOverlay when an id is clicked', async function() {
            component.commits = [testData.commit];
            fixture.detectChanges();
            await fixture.whenStable();

            const id = element.queryAll(By.css('table tr td.commit-id a'))[0];
            id.triggerEventHandler('click', null);
            expect(matDialog.open).toHaveBeenCalledWith(CommitInfoOverlayComponent, {data: {commit: testData.commit, ontRecordId: testData.recordId, type: testData.type}});
        });
    });
});
