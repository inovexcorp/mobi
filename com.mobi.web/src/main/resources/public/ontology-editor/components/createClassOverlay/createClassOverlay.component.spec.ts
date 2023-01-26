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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule, MatDialogModule, MatDialogRef, MatFormFieldModule, MatIconModule, MatInputModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { 
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { StaticIriComponent } from '../staticIri/staticIri.component';
import { AdvancedLanguageSelectComponent } from '../advancedLanguageSelect/advancedLanguageSelect.component';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { SuperClassSelectComponent } from '../superClassSelect/superClassSelect.component';
import { DCTERMS, OWL } from '../../../prefixes';
import { HierarchyNode } from '../../../shared/models/hierarchyNode.interface';
import { CreateClassOverlayComponent } from './createClassOverlay.component';

describe('Create Class Overlay component', function() {
    let component: CreateClassOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CreateClassOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateClassOverlayComponent>>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let camelCaseStub: jasmine.SpyObj<CamelCasePipe>;
    let splitIRIStub: jasmine.SpyObj<SplitIRIPipe>;

    const namespace = 'http://test.com#';
    const iri = 'iri#';

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
                CreateClassOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(StaticIriComponent),
                MockComponent(AdvancedLanguageSelectComponent),
                MockComponent(SuperClassSelectComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                { provide: CamelCasePipe, useClass: MockPipe(CamelCasePipe) },
                { provide: SplitIRIPipe, useClass: MockPipe(SplitIRIPipe) },
            ]
        });
    });

    beforeEach(function() {
        ontologyStateStub = TestBed.get(OntologyStateService);
        ontologyStateStub.getDuplicateValidator.and.returnValue(() => null);
        fixture = TestBed.createComponent(CreateClassOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
        camelCaseStub = TestBed.get(CamelCasePipe);
        splitIRIStub = TestBed.get(SplitIRIPipe);
        
        ontologyStateStub.getDefaultPrefix.and.returnValue(iri);
        ontologyStateStub.saveCurrentChanges.and.returnValue(of([]));
        ontologyStateStub.listItem = new OntologyListItem();

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

    it('initializes with the correct values', function() {
        component.ngOnInit();
        expect(ontologyStateStub.getDefaultPrefix).toHaveBeenCalledWith();
        expect(component.clazz['@id']).toEqual(iri);
        expect(component.clazz['@type']).toEqual([OWL + 'Class']);
        expect(component.clazz[DCTERMS + 'title']).toEqual([{'@value': ''}]);
        expect(component.clazz[DCTERMS + 'description']).toBeUndefined();
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['static-iri', 'input[name="name"]', 'textarea', 'advanced-language-select', 'super-class-select'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on the validity of the form', function() {
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();
            
            component.createForm.controls.title.setValue(null);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();

            component.createForm.controls.title.setValue('test');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    describe('controller methods', function() {
        describe('should handle a iri change', function() {
            beforeEach(function() {
                component.createForm.controls.iri.setValue(namespace);
                camelCaseStub.transform.and.callFake(a => a);
            });
            it('if the iri has not been manually changed', function() {
                component.nameChanged('new');
                expect(component.createForm.controls.iri.value).toEqual(namespace + 'new');
                expect(splitIRIStub.transform).toHaveBeenCalledWith(namespace);
                expect(camelCaseStub.transform).toHaveBeenCalledWith('new', 'class');
            });
            it('unless the iri has been manually changed', function() {
                component.iriHasChanged = true;
                component.nameChanged('new');
                expect(component.createForm.controls.iri.value).toEqual(namespace);
                expect(splitIRIStub.transform).not.toHaveBeenCalled();
                expect(camelCaseStub.transform).not.toHaveBeenCalled();
            });
        });
        it('onEdit changes iri based on the params', function() {
            component.onEdit('begin', 'then', 'end');
            expect(component.clazz['@id']).toEqual('begin' + 'then' + 'end');
            expect(component.iriHasChanged).toEqual(true);
            expect(ontologyStateStub.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        describe('create calls the correct manager functions when super classes', function() {
            const classIri = 'class-iri';
            const hierarchyNode: HierarchyNode = {
                entityIRI: classIri,
                hasChildren: false,
                indent: 1,
                path: ['path1', 'path2'],
                entityInfo: {label: 'label', names: ['name']},
                joinedPath: 'path1path2',
            };
            beforeEach(function() {
                spyOn(component, 'nameChanged');
                component.ngOnInit();
                ontologyStateStub.createFlatEverythingTree.and.returnValue([hierarchyNode]);
                ontologyStateStub.flattenHierarchy.and.returnValue([hierarchyNode]);
                component.createForm.controls.iri.setValue(classIri);
                component.createForm.controls.title.setValue('label');
                component.createForm.controls.description.setValue('description');
                component.createForm.controls.language.setValue('en');
            });
            it('are not set', fakeAsync(function() {
                component.create();
                tick();
                expect(ontologyStateStub.addLanguageToNewEntity).toHaveBeenCalledWith(component.clazz, component.createForm.controls.language.value);
                expect(ontologyStateStub.addEntity).toHaveBeenCalledWith(component.clazz);
                expect(ontologyStateStub.createFlatEverythingTree).toHaveBeenCalledWith(ontologyStateStub.listItem);
                expect(ontologyStateStub.listItem.flatEverythingTree).toEqual([hierarchyNode]);
                expect(ontologyStateStub.addToClassIRIs).toHaveBeenCalledWith(ontologyStateStub.listItem, classIri);
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, component.clazz);
                expect(ontologyStateStub.flattenHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.classes);
                expect(ontologyStateStub.listItem.classes.flat).toEqual([hierarchyNode]);
                expect(matDialogRef.close).toHaveBeenCalledWith();
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(ontologyStateStub.setSuperClasses).not.toHaveBeenCalled();
                expect(ontologyStateStub.openSnackbar).toHaveBeenCalledWith(classIri);
            }));
            describe('are set', function() {
                beforeEach(function () {
                    component.selectedClasses = [{'@id': 'classA'}];
                });
                it('including a derived concept', fakeAsync(function() {
                    ontologyStateStub.containsDerivedConcept.and.returnValue(true);
                    component.create();
                    tick();
                    expect(ontologyStateStub.addLanguageToNewEntity).toHaveBeenCalledWith(component.clazz, component.createForm.controls.language.value);
                    expect(ontologyStateStub.addEntity).toHaveBeenCalledWith(component.clazz);
                    expect(ontologyStateStub.createFlatEverythingTree).toHaveBeenCalledWith(ontologyStateStub.listItem);
                    expect(ontologyStateStub.listItem.flatEverythingTree).toEqual([hierarchyNode]);
                    expect(ontologyStateStub.addToClassIRIs).toHaveBeenCalledWith(ontologyStateStub.listItem, classIri);
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, component.clazz);
                    expect(ontologyStateStub.flattenHierarchy).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(ontologyStateStub.listItem.derivedConcepts).toContain(classIri);
                    expect(ontologyStateStub.setSuperClasses).toHaveBeenCalledWith(classIri, ['classA']);
                    expect(ontologyStateStub.openSnackbar).toHaveBeenCalledWith(classIri);
                }));
                it('without a derived concept',fakeAsync( function() {
                    component.create();
                    tick();
                    expect(ontologyStateStub.addLanguageToNewEntity).toHaveBeenCalledWith(component.clazz, component.createForm.controls.language.value);
                    expect(ontologyStateStub.addEntity).toHaveBeenCalledWith(component.clazz);
                    expect(ontologyStateStub.createFlatEverythingTree).toHaveBeenCalledWith(ontologyStateStub.listItem);
                    expect(ontologyStateStub.listItem.flatEverythingTree).toEqual([hierarchyNode]);
                    expect(ontologyStateStub.addToClassIRIs).toHaveBeenCalledWith(ontologyStateStub.listItem, classIri);
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, component.clazz);
                    expect(ontologyStateStub.flattenHierarchy).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(ontologyStateStub.listItem.derivedConcepts).toEqual([]);
                    expect(ontologyStateStub.setSuperClasses).toHaveBeenCalledWith(classIri, ['classA']);
                    expect(ontologyStateStub.openSnackbar).toHaveBeenCalledWith(classIri);
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
    it('should call create when the button is clicked', function() {
        spyOn(component, 'create');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.create).toHaveBeenCalledWith();
    });
});
