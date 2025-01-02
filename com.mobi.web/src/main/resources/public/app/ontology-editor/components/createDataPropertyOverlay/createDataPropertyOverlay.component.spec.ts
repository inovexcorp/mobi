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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { UntypedFormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { 
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { DCTERMS, OWL, RDFS } from '../../../prefixes';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { StaticIriComponent } from '../staticIri/staticIri.component';
import { AdvancedLanguageSelectComponent } from '../../../shared/components/advancedLanguageSelect/advancedLanguageSelect.component';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
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
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let camelCaseStub: jasmine.SpyObj<CamelCasePipe>;

    const namespace = 'http://test.com#';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
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
            ]
        });
    });

    beforeEach(function() {
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyStateStub.getDuplicateValidator.and.returnValue(() => null);
        fixture = TestBed.createComponent(CreateDataPropertyOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CreateDataPropertyOverlayComponent>>;
        camelCaseStub = TestBed.inject(CamelCasePipe) as jasmine.SpyObj<CamelCasePipe>;

        ontologyStateStub.getDefaultPrefix.and.returnValue(namespace);
        ontologyStateStub.saveCurrentChanges.and.returnValue(of([]));
        ontologyStateStub.listItem = new OntologyListItem();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        ontologyStateStub = null;
        camelCaseStub = null;
    });

    it('initializes with the correct values', function() {
        component.ngOnInit();
        expect(ontologyStateStub.getDefaultPrefix).toHaveBeenCalledWith();
        expect(component.property['@id']).toEqual(namespace);
        expect(component.property['@type']).toEqual([`${OWL}DatatypeProperty`]);
        expect(component.property[`${DCTERMS}title`]).toEqual([{'@value': ''}]);
        expect(component.property[`${DCTERMS}description`]).toBeUndefined();
        expect(component.characteristics).toEqual([
            {
                typeIRI: `${OWL}FunctionalProperty`,
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
                expect(component.createForm.controls.iri.value).toEqual(`${namespace}new`);
                expect(camelCaseStub.transform).toHaveBeenCalledWith('new', 'property');
            });
            it('unless the iri has been manually changed', function() {
                component.iriHasChanged = true;
                component.nameChanged('new');
                expect(component.createForm.controls.iri.value).toEqual(namespace);
                expect(camelCaseStub.transform).not.toHaveBeenCalled();
            });
        });
        it('onEdit changes iri based on the params', function() {
            component.onEdit('begin', 'then', 'end');
            expect(component.property['@id']).toEqual('beginthenend');
            expect(component.iriHasChanged).toEqual(true);
            expect(ontologyStateStub.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
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
                ontologyStateStub.flattenHierarchy.and.returnValue([hierarchyNode]);
                component.createForm.controls.iri.setValue(propIri);
                component.createForm.controls.title.setValue('label');
                component.createForm.controls.description.setValue('description');
                component.createForm.controls.language.setValue('en');
                ontologyStateStub.createFlatEverythingTree.and.returnValue([hierarchyNode]);
            });
            it('and sets the domains and ranges', fakeAsync(function() {
                component.selectedDomains = ['domain'];
                component.selectedRanges = ['range'];
                component.create();
                tick();
                expect(component.property[`${DCTERMS}description`]).toEqual([{'@value': 'description', '@language': 'en'}]);
                expect(component.property[`${RDFS}domain`]).toEqual([{'@id': 'domain'}]);
                expect(component.property[`${RDFS}range`]).toEqual([{'@id': 'range'}]);
                expect(ontologyStateStub.updatePropertyIcon).toHaveBeenCalledWith(component.property);
                expect(ontologyStateStub.addEntity).toHaveBeenCalledWith(component.property);
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, component.property);
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(matDialogRef.close).toHaveBeenCalledWith();
                expect(ontologyStateStub.openSnackbar).toHaveBeenCalledWith(propIri);
            }));
            describe('if super properties', function() {
                it('are not set', fakeAsync(function() {
                    component.create();
                    tick();
                    expect(ontologyStateStub.updatePropertyIcon).toHaveBeenCalledWith(component.property);
                    expect(ontologyStateStub.addEntity).toHaveBeenCalledWith(component.property);
                    expect(ontologyStateStub.createFlatEverythingTree).toHaveBeenCalledWith(ontologyStateStub.listItem);
                    expect(ontologyStateStub.listItem.flatEverythingTree).toEqual([hierarchyNode]);
                    expect(ontologyStateStub.listItem.dataProperties.iris).toEqual({[propIri]: ontologyStateStub.listItem.ontologyId});
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, component.property);
                    expect(ontologyStateStub.handleNewProperty).toHaveBeenCalledWith(component.property);
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                    expect(ontologyStateStub.flattenHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.dataProperties);
                    expect(ontologyStateStub.openSnackbar).toHaveBeenCalledWith(propIri);
                }));
                it('are set', fakeAsync(function() {
                    component.selectedSubProperties = [{'@id': 'propertyA'}];
                    component.create();
                    tick();
                    expect(ontologyStateStub.updatePropertyIcon).toHaveBeenCalledWith(component.property);
                    expect(ontologyStateStub.addEntity).toHaveBeenCalledWith(component.property);
                    expect(ontologyStateStub.createFlatEverythingTree).toHaveBeenCalledWith(ontologyStateStub.listItem);
                    expect(ontologyStateStub.listItem.flatEverythingTree).toEqual([hierarchyNode]);
                    expect(ontologyStateStub.listItem.dataProperties.iris).toEqual({[propIri]: ontologyStateStub.listItem.ontologyId});
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, component.property);
                    expect(ontologyStateStub.handleNewProperty).toHaveBeenCalledWith(component.property);
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                    expect(component.property[`${RDFS}subPropertyOf`]).toEqual([{'@id': 'propertyA'}]);
                    expect(ontologyStateStub.setSuperProperties).toHaveBeenCalledWith(propIri, ['propertyA'], 'dataProperties');
                    expect(ontologyStateStub.openSnackbar).toHaveBeenCalledWith(propIri);
                }));
            });
            describe('if characteristics', function() {
                it('are set', fakeAsync(function() {
                    (component.createForm.controls.characteristics as UntypedFormArray).controls.forEach(obj => {
                        obj.setValue(true);
                    });
                    component.create();
                    tick();
                    expect(component.property['@type'].includes(`${OWL}FunctionalProperty`)).toEqual(true);
                    expect(ontologyStateStub.openSnackbar).toHaveBeenCalledWith(propIri);
                }));
                it('are not set', fakeAsync(function() {
                    component.create();
                    tick();
                    expect(component.property['@type'].includes(`${OWL}FunctionalProperty`)).toEqual(false);
                    expect(ontologyStateStub.openSnackbar).toHaveBeenCalledWith(propIri);
                }));
            });
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
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
