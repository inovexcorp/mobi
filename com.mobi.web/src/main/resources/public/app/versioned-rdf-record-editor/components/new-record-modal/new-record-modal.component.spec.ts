/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { cloneDeep } from 'lodash';

import { MockVersionedRdfState, cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { RdfUpload } from '../../../shared/models/rdfUpload.interface';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { stateServiceToken } from '../../injection-token';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { DCTERMS, OWL } from '../../../prefixes';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { AdvancedLanguageSelectComponent } from '../../../shared/components/advancedLanguageSelect/advancedLanguageSelect.component';
import { KeywordSelectComponent } from '../../../shared/components/keywordSelect/keywordSelect.component';
import { NewRecordModalComponent } from './new-record-modal.component';

describe('New Record Modal component', function() {
    let component: NewRecordModalComponent<VersionedRdfListItem>;
    let element: DebugElement;
    let fixture: ComponentFixture<NewRecordModalComponent<VersionedRdfListItem>>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<NewRecordModalComponent<VersionedRdfListItem>>>;
    let stateStub: jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
    let camelCaseStub: jasmine.SpyObj<CamelCasePipe>;
    
    const namespace = 'http://test.com#';
    const error: RESTError = {
        error: '',
        errorMessage: 'Error',
        errorDetails: []
    };
    const rdfUpload: RdfUpload = {
        title: 'Record Name',
        description: '',
        keywords: ['keyword1', 'keyword2'],
    };
    const expectedOntology: JSONLDObject = {
        '@id': namespace,
        '@type': [`${OWL}Ontology`],
        [`${DCTERMS}title`]: [{'@value': rdfUpload.title}]
    };
    rdfUpload.jsonld = [expectedOntology];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatSelectModule,
                MatDialogModule,
                MatButtonModule,
                NoopAnimationsModule,
                MatChipsModule,
                MatIconModule
            ],
            declarations: [
                NewRecordModalComponent,
                MockComponent(AdvancedLanguageSelectComponent),
                MockComponent(KeywordSelectComponent),
                MockComponent(ErrorDisplayComponent),
            ],
            providers: [
                MockProvider(ToastService),
                { provide: CamelCasePipe, useClass: MockPipe(CamelCasePipe) },
                { provide: MAT_DIALOG_DATA, useValue: { defaultNamespace: namespace } },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                { provide: stateServiceToken, useClass: MockVersionedRdfState },
            ]
        }).compileComponents();

        stateStub = TestBed.inject(stateServiceToken) as jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
        stateStub.createAndOpen.and.returnValue(of({ recordId: 'recordId', branchId: 'branchId', commitId: 'commitId'}));
        stateStub.type = 'urn:type';
        fixture = TestBed.createComponent(NewRecordModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<NewRecordModalComponent<VersionedRdfListItem>>>;
        camelCaseStub = TestBed.inject(CamelCasePipe) as jasmine.SpyObj<CamelCasePipe>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        stateStub = null;
        camelCaseStub = null;
    });

    it('should initialize the form correctly', function() {
        component.ngOnInit();
        expect(component.newRecordForm.controls.iri.value).toEqual(namespace);
    });
    describe('controller methods', function() {
        it('should set the correct state when the IRI is manually changed', function() {
            component.manualIRIEdit();
            expect(component.iriHasChanged).toBeTrue();
        });
        describe('should handle a title change', function() {
            beforeEach(function() {
                component.newRecordForm.controls.iri.setValue(namespace);
                camelCaseStub.transform.and.callFake(a => a);
            });
            it('if the iri has not been manually changed', function() {
                component.nameChanged('new');
                expect(component.newRecordForm.controls.iri.value).toEqual(`${namespace}new`);
                expect(camelCaseStub.transform).toHaveBeenCalledWith('new', 'class');
            });
            it('unless the iri has been manually changed', function() {
                component.iriHasChanged = true;
                component.nameChanged('new');
                expect(component.newRecordForm.controls.iri.value).toEqual(namespace);
                expect(camelCaseStub.transform).not.toHaveBeenCalled();
            });
        });
        describe('should create a record', function() {
          beforeEach(function() {
              component.newRecordForm.controls.iri.setValue(namespace);
              component.newRecordForm.controls['title'].setValue(rdfUpload.title);
              component.newRecordForm.controls.keywords.setValue([rdfUpload.keywords[0], rdfUpload.keywords[1]]);
          });
          it('unless an error occurs', fakeAsync(function() {
              stateStub.createAndOpen.and.returnValue(throwError(error));
              component.create();
              tick();
              expect(stateStub.createAndOpen).toHaveBeenCalledWith(rdfUpload);
              expect(matDialogRef.close).not.toHaveBeenCalled();
              expect(component.error).toEqual(error);
          }));
          describe('successfully', function() {
              it('with a description', fakeAsync(function() {
                  const newExpectedOntology = cloneDeep(expectedOntology);
                  newExpectedOntology[`${DCTERMS}description`] = [{'@value': 'description', '@language': 'en'}];
                  newExpectedOntology[`${DCTERMS}title`][0]['@language'] = 'en';
                  component.newRecordForm.controls.description.setValue('description');
                  component.newRecordForm.controls.language.setValue('en');
                  const newRdfUpload = cloneDeep(rdfUpload);
                  newRdfUpload.description = 'description';
                  newRdfUpload.jsonld = [newExpectedOntology];
                  component.create();
                  tick();
                  expect(stateStub.createAndOpen).toHaveBeenCalledWith(newRdfUpload);
                  expect(matDialogRef.close).toHaveBeenCalledWith();
              }));
              it('without description', fakeAsync(function() {
                  component.create();
                  tick();
                  expect(stateStub.createAndOpen).toHaveBeenCalledWith(rdfUpload);
                  expect(matDialogRef.close).toHaveBeenCalledWith();
              }));
          });
      });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['input[name="iri"]', 'input[name="title"]', 'textarea', 'keyword-select', 'advanced-language-select'].forEach(function(item) {
            it(`with a ${item}`, function() {
                expect(element.queryAll(By.css(item)).length).toEqual(1);
            });
        });
        it('when there is an error', async function() {
            let errorDisplay = element.queryAll(By.css('error-display'));
            expect(errorDisplay.length).toEqual(0);

            component.error = { errorMessage: 'error', error: '', errorDetails: [] };
            fixture.detectChanges();
            await fixture.whenStable();
            errorDisplay = element.queryAll(By.css('error-display'));

            expect(errorDisplay.length).toBe(1);
            expect(errorDisplay[0].nativeElement.innerText).toEqual('error');
            expect(matDialogRef.close).not.toHaveBeenCalled();
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call add when the submit button is clicked', function() {
        spyOn(component, 'create');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.create).toHaveBeenCalledWith();
    });
});
