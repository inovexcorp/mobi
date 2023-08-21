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

import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { DCTERMS, ONTOLOGYSTATE } from '../../../prefixes';
import { CommitHistoryTableComponent } from '../../../shared/components/commitHistoryTable/commitHistoryTable.component';
import { Commit } from '../../../shared/models/commit.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CommitsTabComponent } from './commitsTab.component';

describe('Commits Tab component', function() {
    let component: CommitsTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitsTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const commit: Commit = {
        id: 'commit',
        creator: {
            firstName: 'firstname',
            lastName: 'lastname',
            username: 'username',
            email: 'email'
        },
        message: '',
        auxiliary: '',
        date: '',
        base: ''
    };
    beforeEach(async () => {
        await TestBed.configureTestingModule({
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
                MockProvider(ToastService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CommitsTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.updateOntologyWithCommit.and.returnValue(of(null));
    });

    afterEach(function() {
        cleanStylesFromDOM();
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
    });
    describe('controller methods', function() {
        describe('should get the title for the current head commit currently selected branch', function() {
            it('if a branch is checked out', function() {
                const branch: JSONLDObject = {'@id': 'branchId', [`${DCTERMS}title`]: [{'@value': 'title'}]};
                ontologyStateStub.listItem.branches = [branch];
                ontologyStateStub.listItem.versionedRdfRecord.branchId = branch['@id'];
                expect(component.getHeadTitle()).toEqual('title');
            });
            it('if a tag is checked out', function() {
                const tag: JSONLDObject = {
                    '@id': 'tag',
                    [`${DCTERMS}title`]: [{ '@value': 'title' }]
                };
                ontologyStateStub.getCurrentStateByRecordId.and.returnValue({ '@id': 'state', [`${ONTOLOGYSTATE}tag`]: [{ '@id': tag['@id'] }] });
                ontologyStateStub.isStateTag.and.returnValue(true);
                ontologyStateStub.listItem.tags = [tag];
                ontologyStateStub.listItem.versionedRdfRecord.recordId = 'recordId';
                expect(component.getHeadTitle()).toEqual('title');
            });
            it('if a commit is checked out', function() {
                expect(component.getHeadTitle()).toEqual('');
            });
        });
        describe('should open the ontology at a commit', function() {
            it('if OntologyStateService.isCommittable is false', function() {
                component.openOntologyAtCommit(commit);
                expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateStub.updateOntologyWithCommit).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, commit.id);
            });
            it('unless OntologyStateService.isCommittable is true', function() {
                ontologyStateStub.isCommittable.and.returnValue(true);
                component.openOntologyAtCommit(commit);
                expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(ontologyStateStub.updateOntologyWithCommit).not.toHaveBeenCalled();
            });
        });
        it('should return the appropriate value to track commits by', function() {
            expect(component.trackCommits(0, commit)).toEqual(commit.id);
        });
    });
});
