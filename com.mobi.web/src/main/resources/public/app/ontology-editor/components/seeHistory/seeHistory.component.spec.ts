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
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { StaticIriComponent } from '../staticIri/staticIri.component';
import { UtilService } from '../../../shared/services/util.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CommitDifference } from '../../../shared/models/commitDifference.interface';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { CommitCompiledResourceComponent } from '../../../shared/components/commitCompiledResource/commitCompiledResource.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { CommitHistoryTableComponent } from '../../../shared/components/commitHistoryTable/commitHistoryTable.component';
import { Commit } from '../../../shared/models/commit.interface';
import { SeeHistoryComponent } from './seeHistory.component';

describe('See History component', function() {
    let component: SeeHistoryComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SeeHistoryComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const commits: Commit[] = [
        {id: 'commit1', auxiliary: '', base: '', creator: undefined, message: '', date: ''},
        {id: 'commit2', auxiliary: '', base: '', creator: undefined, message: '', date: ''}
    ];
    const resource: JSONLDObject = {
        '@id': 'www.test.com',
        '@type': ['commit'],
        'extraProp': ['test']
    };
    const commitDifference: CommitDifference = new CommitDifference();
    commitDifference.commit = {'@id': '', '@type': []};
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatButtonModule,
                MatFormFieldModule,
                MatSelectModule
            ],
            declarations: [
                SeeHistoryComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(StaticIriComponent),
                MockComponent(CommitCompiledResourceComponent),
                MockComponent(CommitHistoryTableComponent),
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                MockProvider(ProgressSpinnerService),
                MockProvider(UtilService)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SeeHistoryComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = {
            '@id': 'www.test.com',
        };

        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        fixture = null;
        component = null;
        element = null;
        catalogManagerStub = null;
        ontologyStateStub = null;
        progressSpinnerStub = null;
        utilStub = null;
    });

    describe('controller methods', function() {
        it('should go to prev', function() {
            component.commits = commits;
            component.selectedCommit = component.commits[0];
            ontologyStateStub.listItem.selectedCommit = component.commits[0];
            spyOn(component, 'selectCommit');
            component.prev();
            expect(component.selectedCommit).toEqual(component.commits[1]);
            expect(component.selectCommit).toHaveBeenCalledWith();
        });
        it('should go to next', function() {
            component.commits = commits;
            component.selectedCommit = component.commits[1];
            ontologyStateStub.listItem.selectedCommit = component.commits[1];
            spyOn(component, 'selectCommit');
            component.next();
            expect(component.selectedCommit).toEqual(component.commits[0]);
            expect(component.selectCommit).toHaveBeenCalledWith();
        });
        it('should go back', function() {
            component.goBack();
            expect(ontologyStateStub.listItem.seeHistory).toBeUndefined();
            expect(ontologyStateStub.listItem.selectedCommit).toBeUndefined();
        });
        describe('should load a list of commits', function() {
            beforeEach(function() {
                spyOn(component, 'selectCommit');
            });
            it('to `commits` in the controller when receiveCommits is called', function() {
                component.receiveCommits(commits);
                expect(component.commits).toEqual(commits);
            });
            it('and set the default value in the dropdown to the latest commit for an entity', function() {
                component.receiveCommits(commits);
                expect(component.selectedCommit).toEqual(commits[0]);
                expect(component.selectCommit).toHaveBeenCalledWith();
            });
        });
        it('should assign the correct label for each commit', function() {
            component.commits = commits;
            utilStub.condenseCommitId.and.returnValue('1234');
            const labels = component.commits.map(commit => component.createLabel(commit.id));
            labels.forEach((label, idx) => {
                if (idx === 0) {
                    expect(label).toEqual('1234 (latest)');
                } else {
                    expect(label).toEqual('1234');
                }
            });
        });
        it('should select a commit', function() {
            component.selectedCommit = commits[0];
            spyOn(component, 'setData');
            component.selectCommit();
            expect(ontologyStateStub.listItem.selectedCommit).toEqual(commits[0]);
            expect(component.setData).toHaveBeenCalledWith();
        });
        describe('sets the important data for display', function() {
            beforeEach(function() {
                ontologyStateStub.listItem.selectedCommit = commits[0];
                catalogManagerStub.getCompiledResource.and.returnValue(of([resource]));
                catalogManagerStub.getDifferenceForSubject.and.returnValue(of(commitDifference));
            });
            it('successfully', function() {
                component.setData();
                fixture.detectChanges();
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.compiledResource);
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.compiledResource);
                expect(catalogManagerStub.getCompiledResource).toHaveBeenCalledWith(commits[0].id, ontologyStateStub.listItem.selected['@id'], true);
                expect(catalogManagerStub.getDifferenceForSubject).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], commits[0].id);
                expect(component.resource).toEqual(resource);
                expect(component.changes).toEqual(commitDifference);
                expect(component.error).toEqual('');
            });
            it('unless getCompiledResource rejects', function() {
                catalogManagerStub.getCompiledResource.and.returnValue(throwError('Error Message'));
                component.setData();
                fixture.detectChanges();
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.compiledResource);
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.compiledResource);
                expect(catalogManagerStub.getCompiledResource).toHaveBeenCalledWith(commits[0].id, ontologyStateStub.listItem.selected['@id'], true);
                expect(catalogManagerStub.getDifferenceForSubject).not.toHaveBeenCalled();
                expect(component.resource).toBeUndefined();
                expect(component.changes).toBeUndefined();
                expect(component.error).toEqual('Error Message');
            });
            it('unless getDifferenceForSubject rejects', function() {
                catalogManagerStub.getDifferenceForSubject.and.returnValue(throwError('Error Message'));
                component.setData();
                fixture.detectChanges();
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.compiledResource);
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.compiledResource);
                expect(catalogManagerStub.getCompiledResource).toHaveBeenCalledWith(commits[0].id, ontologyStateStub.listItem.selected['@id'], true);
                expect(catalogManagerStub.getDifferenceForSubject).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], commits[0].id);
                expect(component.resource).toBeUndefined();
                expect(component.changes).toBeUndefined();
                expect(component.error).toEqual('Error Message');
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.see-history-header')).length).toEqual(1);
            expect(element.queryAll(By.css('.see-history-title')).length).toEqual(1);
        });
        it('with .form-groups', function() {
            expect(element.queryAll(By.css('.form-group')).length).toEqual(2);
        });
        ['static-iri', '.mat-select', 'commit-compiled-resource', 'commit-history-table'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
    });
    it('should call goBack when the button is clicked', function() {
        spyOn(component, 'goBack');
        const button = element.queryAll(By.css('.back-column button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.goBack).toHaveBeenCalledWith();
    });
    it('should call prev when the previous button is clicked', function() {
        spyOn(component, 'prev');
        const button = element.queryAll(By.css('button.previous-btn'))[0];
        button.triggerEventHandler('click', null);
        expect(component.prev).toHaveBeenCalledWith();
    });
    it('should call next when the next button is clicked', function() {
        spyOn(component, 'next');
        const button = element.queryAll(By.css('button.next-btn'))[0];
        button.triggerEventHandler('click', null);
        expect(component.next).toHaveBeenCalledWith();
    });
});
