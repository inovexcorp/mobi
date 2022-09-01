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
import { MatButtonModule, MatCheckboxModule, MatDialogModule, MatDialogRef, MatFormFieldModule, MatIconModule, MatInputModule, MatOptionModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { 
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';
import { DCTERMS, OWL, RDFS } from '../../../prefixes';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { StaticIriComponent } from '../staticIri/staticIri.component';
import { AdvancedLanguageSelectComponent } from '../advancedLanguageSelect/advancedLanguageSelect.component';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { IriSelectOntologyComponent } from '../iriSelectOntology/iriSelectOntology.component';
import { SuperPropertySelectComponent } from '../superPropertySelect/superPropertySelect.component';
import { HierarchyNode } from '../../../shared/models/hierarchyNode.interface';
import { CreateDataPropertyOverlayComponent } from './createDataPropertyOverlay.component';

describe('Create Data Property Overlay component', function() {
    let component: CreateDataPropertyOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CreateDataPropertyOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateDataPropertyOverlayComponent>>;
    let ontologyStateServiceStub: jasmine.SpyObj<OntologyStateService>;
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
                MatIconModule,
                MatCheckboxModule,
                MatOptionModule
            ],
            declarations: [
                CreateDataPropertyOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(StaticIriComponent),
                MockComponent(AdvancedLanguageSelectComponent),
                MockComponent(IriSelectOntologyComponent),
                MockComponent(SuperPropertySelectComponent),
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
        fixture = TestBed.createComponent(CreateDataPropertyOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
        ontologyStateServiceStub = TestBed.get(OntologyStateService);
        camelCaseStub = TestBed.get(CamelCasePipe);

        ontologyStateServiceStub.getDefaultPrefix.and.returnValue(iri);
        ontologyStateServiceStub.saveCurrentChanges.and.returnValue(of([]));
        ontologyStateServiceStub.listItem = new OntologyListItem();

        splitIRIStub = TestBed.get(SplitIRIPipe);
        splitIRIStub.transform.and.returnValue({begin: 'http://test.com', then: '#', end: ''});
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        ontologyStateServiceStub = null;
        camelCaseStub = null;
        splitIRIStub = null;
    });

    it('initializes with the correct values', function() {
        component.ngOnInit();
        expect(ontologyStateServiceStub.getDefaultPrefix).toHaveBeenCalledWith();
        expect(component.property['@id']).toEqual(iri);
        expect(component.property['@type']).toEqual([OWL + 'DatatypeProperty']);
        expect(component.property[DCTERMS + 'title']).toEqual([{'@value': ''}]);
        expect(component.property[DCTERMS + 'description']).toBeUndefined();
        expect(component.characteristics).toEqual([
            {
                typeIRI: OWL + 'FunctionalProperty',
                displayText: 'Functional Property',
            }
        ]);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['static-iri', 'input[name="name"]', 'textarea', 'advanced-language-select', 'super-property-select', 'iri-select-ontology[displayText="Domain"]', 'iri-select-ontology[displayText="Range"]'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with mat-checkboxes', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(1);
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
        describe('should handle a title change', function() {
            beforeEach(function() {
                component.createForm.controls.iri.setValue(namespace);
                camelCaseStub.transform.and.callFake(a => a);
            });
            it('if the iri has not been manually changed', function() {
                component.nameChanged('new');
                expect(component.createForm.controls.iri.value).toEqual(namespace + 'new');
                expect(splitIRIStub.transform).toHaveBeenCalledWith(namespace);
                expect(camelCaseStub.transform).toHaveBeenCalledWith('new', 'property');
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
            expect(component.property['@id']).toEqual('begin' + 'then' + 'end');
            expect(component.iriHasChanged).toEqual(true);
            expect(ontologyStateServiceStub.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        describe('create calls the correct manager functions', function() {
            const propIri = 'property-iri';
            const hierarchyNode: HierarchyNode = {
                entityIRI: propIri,
                hasChildren: false,
                indent: 1,
                path: ['path1', 'path2'],
                entityInfo: {label: 'label', names: ['name']},
                joinedPath: 'path1path2',
            };
            beforeEach(function() {
                ontologyStateServiceStub.flattenHierarchy.and.returnValue([hierarchyNode]);
                component.createForm.controls.iri.setValue(propIri);
                component.createForm.controls.title.setValue('label');
                component.createForm.controls.description.setValue('description');
                component.createForm.controls.language.setValue('en');
                ontologyStateServiceStub.createFlatEverythingTree.and.returnValue([hierarchyNode]);
            });
            it('and sets the domains and ranges', fakeAsync(function() {
                component.selectedDomains = ['domain'];
                component.selectedRanges = ['range'];
                component.create();
                tick();
                expect(component.property[DCTERMS + 'description']).toEqual([{'@value': 'description'}]);
                expect(component.property[RDFS + 'domain']).toEqual([{'@id': 'domain'}]);
                expect(component.property[RDFS + 'range']).toEqual([{'@id': 'range'}]);
                expect(ontologyStateServiceStub.addLanguageToNewEntity).toHaveBeenCalledWith(component.property, component.createForm.controls.language.value);
                expect(ontologyStateServiceStub.updatePropertyIcon).toHaveBeenCalledWith(component.property);
                expect(ontologyStateServiceStub.addEntity).toHaveBeenCalledWith(component.property);
                expect(ontologyStateServiceStub.addToAdditions).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.versionedRdfRecord.recordId, component.property);
                expect(ontologyStateServiceStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(matDialogRef.close).toHaveBeenCalledWith();
                expect(ontologyStateServiceStub.openSnackbar).toHaveBeenCalledWith(propIri);
            }));
            describe('if super properties', function() {
                it('are not set', fakeAsync(function() {
                    component.create();
                    tick();
                    expect(ontologyStateServiceStub.addLanguageToNewEntity).toHaveBeenCalledWith(component.property, component.createForm.controls.language.value);
                    expect(ontologyStateServiceStub.updatePropertyIcon).toHaveBeenCalledWith(component.property);
                    expect(ontologyStateServiceStub.addEntity).toHaveBeenCalledWith(component.property);
                    expect(ontologyStateServiceStub.createFlatEverythingTree).toHaveBeenCalledWith(ontologyStateServiceStub.listItem);
                    expect(ontologyStateServiceStub.listItem.flatEverythingTree).toEqual([hierarchyNode]);
                    expect(ontologyStateServiceStub.listItem.dataProperties.iris).toEqual({[propIri]: ontologyStateServiceStub.listItem.ontologyId});
                    expect(ontologyStateServiceStub.addToAdditions).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.versionedRdfRecord.recordId, component.property);
                    expect(ontologyStateServiceStub.handleNewProperty).toHaveBeenCalledWith(component.property);
                    expect(ontologyStateServiceStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                    expect(ontologyStateServiceStub.flattenHierarchy).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.dataProperties);
                    expect(ontologyStateServiceStub.openSnackbar).toHaveBeenCalledWith(propIri);
                }));
                it('are set', fakeAsync(function() {
                    component.selectedSubProperties = [{'@id': 'propertyA'}];
                    component.create();
                    tick();
                    expect(ontologyStateServiceStub.addLanguageToNewEntity).toHaveBeenCalledWith(component.property, component.createForm.controls.language.value);
                    expect(ontologyStateServiceStub.updatePropertyIcon).toHaveBeenCalledWith(component.property);
                    expect(ontologyStateServiceStub.addEntity).toHaveBeenCalledWith(component.property);
                    expect(ontologyStateServiceStub.createFlatEverythingTree).toHaveBeenCalledWith(ontologyStateServiceStub.listItem);
                    expect(ontologyStateServiceStub.listItem.flatEverythingTree).toEqual([hierarchyNode]);
                    expect(ontologyStateServiceStub.listItem.dataProperties.iris).toEqual({[propIri]: ontologyStateServiceStub.listItem.ontologyId});
                    expect(ontologyStateServiceStub.addToAdditions).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.versionedRdfRecord.recordId, component.property);
                    expect(ontologyStateServiceStub.handleNewProperty).toHaveBeenCalledWith(component.property);
                    expect(ontologyStateServiceStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                    expect(component.property[RDFS + 'subPropertyOf']).toEqual([{'@id': 'propertyA'}]);
                    expect(ontologyStateServiceStub.setSuperProperties).toHaveBeenCalledWith(propIri, ['propertyA'], 'dataProperties');
                    expect(ontologyStateServiceStub.openSnackbar).toHaveBeenCalledWith(propIri);
                }));
            });
            describe('if characteristics', function() {
                it('are set', fakeAsync(function() {
                    (component.createForm.controls.characteristics as FormArray).controls.forEach(obj => {
                        obj.setValue(true);
                    });
                    component.create();
                    tick();
                    expect(component.property['@type'].includes(OWL + 'FunctionalProperty')).toEqual(true);
                    expect(ontologyStateServiceStub.openSnackbar).toHaveBeenCalledWith(propIri);
                }));
                it('are not set', fakeAsync(function() {
                    component.create();
                    tick();
                    expect(component.property['@type'].includes(OWL + 'FunctionalProperty')).toEqual(false);
                    expect(ontologyStateServiceStub.openSnackbar).toHaveBeenCalledWith(propIri);
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