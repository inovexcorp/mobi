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

import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule, MatIconModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM, mockUtil } from '../../../../../../test/ts/Shared';
import { ONTOLOGYSTATE } from '../../../prefixes';
import { CommitHistoryTableComponent } from '../../../shared/components/commitHistoryTable/commitHistoryTable.component';
import { Commit } from '../../../shared/models/commit.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CommitsTabComponent } from './commitsTab.component';

describe('Commits Tab component', function() {
    let component: CommitsTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitsTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let utilStub;

    const commit: Commit = {
        id: 'commit',
        creator: undefined,
        message: '',
        auxiliary: '',
        date: '',
        base: ''
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatButtonModule,
                MatIconModule,
            ],
            declarations: [
                CommitsTabComponent,
                MockComponent(CommitHistoryTableComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                { provide: 'utilService', useClass: mockUtil },
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CommitsTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);
        utilStub = TestBed.get('utilService');

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.updateOntologyWithCommit.and.returnValue(of(null));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        utilStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.commits-tab')).length).toEqual(1);
        });
        ['.col-10', '.section-header', 'commit-history-table'].forEach(el => {
            it('with a ' + el, function() {
                expect(element.queryAll(By.css(el)).length).toEqual(1);
            });
        });
        it('depending on how many commits there are', function() {
            expect(element.queryAll(By.css('.view-table')).length).toEqual(0);

            const commit2 = Object.assign({}, commit);
            commit2.id = 'commit2';
            component.commits = [commit, commit2];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.view-table')).length).toEqual(1);
            expect(element.queryAll(By.css('.view-table tbody tr')).length).toEqual(component.commits.length);
        });
        it('depending on whether the user has unsaved changes', function() {
            ontologyStateStub.hasChanges.and.returnValue(false);
            component.commits = [commit];
            fixture.detectChanges();
            const button = element.queryAll(By.css('.view-table tbody button'))[0];
            expect(button.properties['disabled']).toBeFalsy();

            ontologyStateStub.hasChanges.and.returnValue(true);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();
        });
        it('depending on whether the user has saved changes', function() {
            ontologyStateStub.hasChanges.and.returnValue(false);
            ontologyStateStub.isCommittable.and.returnValue(false);
            component.commits = [commit];
            fixture.detectChanges();
            const button = element.queryAll(By.css('.view-table tbody button'))[0];
            expect(button.properties['disabled']).toBeFalsy();

            ontologyStateStub.isCommittable.and.returnValue(true);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        describe('should get the title for the current head commit currently selected branch', function() {
            beforeEach(function() {
                utilStub.getDctermsValue.and.returnValue('title');
            });
            it('if a branch is checked out', function() {
                const branch: JSONLDObject = {'@id': 'branchId', 'http://purl.org/dc/terms/title': [{'@value': 'title'}]};
                ontologyStateStub.listItem.branches = [branch];
                ontologyStateStub.listItem.versionedRdfRecord.branchId = branch['@id'];
                expect(component.getHeadTitle()).toEqual('title');
                expect(utilStub.getDctermsValue).toHaveBeenCalledWith(branch, 'title');
            });
            it('if a tag is checked out', function() {
                ontologyStateStub.getCurrentStateByRecordId.and.returnValue({'@id': 'state'});
                const tag: JSONLDObject = {'@id': 'tag'};
                utilStub.getPropertyId.and.returnValue(tag['@id']);
                ontologyStateStub.isStateTag.and.returnValue(true);
                ontologyStateStub.listItem.tags = [tag];
                ontologyStateStub.listItem.versionedRdfRecord.recordId = 'recordId';
                expect(component.getHeadTitle()).toEqual('title');
                expect(utilStub.getPropertyId).toHaveBeenCalledWith({'@id': 'state'}, ONTOLOGYSTATE + 'tag');
                expect(utilStub.getDctermsValue).toHaveBeenCalledWith(tag, 'title');
            });
            it('if a commit is checked out', function() {
                expect(component.getHeadTitle()).toEqual('');
            });
        });
        it('should open the ontology at a commit', function() {
            component.openOntologyAtCommit(commit);
            expect(ontologyStateStub.updateOntologyWithCommit).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, commit.id);
        });
        it('should return the appropriate value to track commits by', function() {
            expect(component.trackCommits(0, commit)).toEqual(commit.id);
        });
    });
    it('should open an ontology at a commit when its view button is clicked', function() {
        component.commits = [commit];
        fixture.detectChanges();
        spyOn(component, 'openOntologyAtCommit');

        const button = element.queryAll(By.css('.view-table tbody button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.openOntologyAtCommit).toHaveBeenCalledWith(commit);
    });
});
