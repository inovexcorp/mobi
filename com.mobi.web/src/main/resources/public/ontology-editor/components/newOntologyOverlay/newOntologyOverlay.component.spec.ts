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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatDialogModule, MatDialogRef, MatFormFieldModule, MatIconModule, MatInputModule, MAT_DIALOG_DATA } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { DCTERMS, OWL } from '../../../prefixes';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { KeywordSelectComponent } from '../../../shared/components/keywordSelect/keywordSelect.component';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { AdvancedLanguageSelectComponent } from '../advancedLanguageSelect/advancedLanguageSelect.component';
import { NewOntologyOverlayComponent } from './newOntologyOverlay.component';

describe('New Ontology Overlay component', function() {
    let component: NewOntologyOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<NewOntologyOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<NewOntologyOverlayComponent>>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let camelCaseStub: jasmine.SpyObj<CamelCasePipe>;
    let splitIRIStub: jasmine.SpyObj<SplitIRIPipe>;

    const error: RESTError = {
        error: '',
        errorMessage: 'Error',
        errorDetails: []
    };
    const namespace = 'http://test.com#';

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                ReactiveFormsModule,
                FormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                NewOntologyOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(AdvancedLanguageSelectComponent),
                MockComponent(KeywordSelectComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                { provide: CamelCasePipe, useClass: MockPipe(CamelCasePipe) },
                { provide: SplitIRIPipe, useClass: MockPipe(SplitIRIPipe) },
                { provide: MAT_DIALOG_DATA, useValue: { defaultNamespace: namespace } },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(NewOntologyOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);
        matDialogRef = TestBed.get(MatDialogRef);
        camelCaseStub = TestBed.get(CamelCasePipe);
        splitIRIStub = TestBed.get(SplitIRIPipe);

        splitIRIStub.transform.and.returnValue({begin: 'http://test.com', then: '#', end: ''});
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        ontologyStateStub = null;
        camelCaseStub = null;
        splitIRIStub = null;
    });

    it('should initialize the form correctly', function() {
        component.ngOnInit();
        expect(component.newOntologyForm.controls.iri.value).toEqual(namespace);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['input[name="iri"]', 'input[name="title"]', 'textarea', 'keyword-select', 'advanced-language-select'].forEach(function(item) {
            it('with a ' + item, function() {
                expect(element.queryAll(By.css(item)).length).toEqual(1);
            });
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
        it('depending on whether an error occurred', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);

            component.error = error;
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('depending on whether the ontology iri is valid', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-error')).length).toEqual(0);

            component.newOntologyForm.controls.iri.setValue('test');
            component.newOntologyForm.controls.iri.markAsTouched();
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-error')).length).toEqual(1);
        });
        it('depending on the validity of the form', function() {
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();
            
            component.newOntologyForm.controls.title.setValue(null);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();

            component.newOntologyForm.controls.title.setValue('test');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('if the iri field is manually edited', function() {
            spyOn(component, 'manualIRIEdit');
            const input = element.queryAll(By.css('input[name="iri"]'))[0];
            expect(input).toBeTruthy();
            input.triggerEventHandler('input', {target: input.nativeElement});
            expect(component.manualIRIEdit).toHaveBeenCalledWith();
        });
    });
    describe('controller methods', function() {
        it('should set the correct state when the IRI is manually changed', function() {
            component.manualIRIEdit();
            expect(component.iriHasChanged).toBeTrue();
        });
        describe('should handle a title change', function() {
            beforeEach(function() {
                component.newOntologyForm.controls.iri.setValue(namespace);
                camelCaseStub.transform.and.callFake(a => a);
            });
            it('if the iri has not been manually changed', function() {
                component.nameChanged('new');
                expect(component.newOntologyForm.controls.iri.value).toEqual(namespace + 'new');
                expect(splitIRIStub.transform).toHaveBeenCalledWith(namespace);
                expect(camelCaseStub.transform).toHaveBeenCalledWith('new', 'class');
            });
            it('unless the iri has been manually changed', function() {
                component.iriHasChanged = true;
                component.nameChanged('new');
                expect(component.newOntologyForm.controls.iri.value).toEqual(namespace);
                expect(splitIRIStub.transform).not.toHaveBeenCalled();
                expect(camelCaseStub.transform).not.toHaveBeenCalled();
            });
        });
        describe('should create an ontology', function() {
            const expectedOntology = {
                '@id': namespace,
                '@type': [OWL + 'Ontology'],
                [DCTERMS + 'title']: [{'@value': 'title'}]
            };
            beforeEach(function() {
                component.newOntologyForm.controls.iri.setValue(namespace);
                component.newOntologyForm.controls.title.setValue('title');
                component.newOntologyForm.controls.keywords.setValue([' one', 'two ']);
                ontologyStateStub.createOntology.and.returnValue(of(null));
            });
            it('unless an error occurs', fakeAsync(function() {
                ontologyStateStub.createOntology.and.returnValue(throwError(error));
                component.create();
                tick();
                expect(ontologyStateStub.addLanguageToNewEntity).toHaveBeenCalledWith(expectedOntology, '');
                expect(ontologyStateStub.createOntology).toHaveBeenCalledWith([expectedOntology], 'title', '', ['one', 'two']);
                expect(matDialogRef.close).not.toHaveBeenCalled();
                expect(component.error).toEqual(error);
            }));
            describe('successfully', function() {
                it('with a description', fakeAsync(function() {
                    const newExpectedOntology = Object.assign({}, expectedOntology);
                    newExpectedOntology[DCTERMS + 'description'] = [{'@value': 'description'}];
                    component.newOntologyForm.controls.description.setValue('description');
                    component.newOntologyForm.controls.language.setValue('en');
                    component.create();
                    tick();
                    expect(ontologyStateStub.addLanguageToNewEntity).toHaveBeenCalledWith(newExpectedOntology, 'en');
                    expect(ontologyStateStub.createOntology).toHaveBeenCalledWith([newExpectedOntology], 'title', 'description', ['one', 'two']);
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                }));
                it('without description', fakeAsync(function() {
                    component.create();
                    tick();
                    expect(ontologyStateStub.addLanguageToNewEntity).toHaveBeenCalledWith(expectedOntology, '');
                    expect(ontologyStateStub.createOntology).toHaveBeenCalledWith([expectedOntology], 'title', '', ['one', 'two']);
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                }));
            });
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call download when the button is clicked', function() {
        spyOn(component, 'create');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.create).toHaveBeenCalledWith();
    });
});
