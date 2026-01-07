/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { of } from 'rxjs';
import { values } from 'lodash';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTabsModule } from '@angular/material/tabs';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { RDFS } from '../../../prefixes';
import { IriSelectOntologyComponent } from '../iriSelectOntology/iriSelectOntology.component';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { ManchesterConverterService } from '../../../shared/services/manchesterConverter.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AxiomOverlayComponent } from './axiomOverlay.component';

describe('Axiom Overlay component', function() {
    let component: AxiomOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<AxiomOverlayComponent>;
    let ontologyStateServiceStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerServiceStub: jasmine.SpyObj<OntologyManagerService>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<AxiomOverlayComponent>>;
    let manchesterConverterStub: jasmine.SpyObj<ManchesterConverterService>;
    let propertyServiceStub: jasmine.SpyObj<PropertyManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const data = {axiomList: []};
    const axiom = {iri: 'http://test.com/axiom', valuesKey: 'list'};
    const localNameMap = {
        'ClassA': 'http://test.com/ClassA',
        'PropA': 'http://test.com/PropA'
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatFormFieldModule,
                MatInputModule,
                MatAutocompleteModule,
                MatDialogModule,
                MatTabsModule,
                MatButtonModule,
                MatIconModule,
            ],
            declarations: [
                AxiomOverlayComponent,
                MockComponent(IriSelectOntologyComponent),
                MockComponent(CodemirrorComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                MockProvider(PropertyManagerService),
                MockProvider(ToastService),
                MockProvider(ManchesterConverterService),
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close']) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(AxiomOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateServiceStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyManagerServiceStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<AxiomOverlayComponent>>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        propertyServiceStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
        manchesterConverterStub = TestBed.inject(ManchesterConverterService) as jasmine.SpyObj<ManchesterConverterService>;

        ontologyStateServiceStub.listItem = new OntologyListItem();
        ontologyStateServiceStub.listItem.selected = {
            '@id': 'axiom1',
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2', '@type': 'type', '@language': 'language'}]
        };

        ontologyStateServiceStub.listItem.iriList = values(localNameMap);
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateServiceStub = null;
        ontologyManagerServiceStub = null;
        propertyServiceStub = null;
        manchesterConverterStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.mat-dialog-title')).length).toEqual(1);
            expect(element.queryAll(By.css('.mat-dialog-content')).length).toEqual(1);
            expect(element.queryAll(By.css('.mat-dialog-actions')).length).toEqual(1);
        });
        ['mat-form-field', 'mat-autocomplete', 'mat-tab-group', 'iri-select-ontology'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with mat-labels', async function() {
            expect(element.queryAll(By.css('.mat-tab-label')).length).toEqual(2);
            element.queryAll(By.css('.mat-tab-label'))[1].triggerEventHandler('click', null);
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('.mat-tab-label')).length).toEqual(2);
            expect(element.queryAll(By.css('ngx-codemirror')).length).toEqual(1);
        });
        it('with a ngx-codemirror', async function() {
            element.queryAll(By.css('.mat-tab-label'))[1].triggerEventHandler('click', null);
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('ngx-codemirror')).length).toEqual(1);
        });
        it('with buttons to submit and cancel', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
        it('depending on whether the form is invalid', async function() {
            component.axiom = axiom;
            component.values = ['value'];
            await fixture.isStable();
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button.properties['disabled']).toBeFalsy();
            component.axiom = undefined;
            await fixture.isStable();
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();
        });
        it('depending on whether an axiom is selected', async function() {
            component.values = ['values'];
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button.properties['disabled']).toBeTruthy();
            component.axiom = axiom;
            await fixture.isStable();
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on whether values have been selected', async function() {
            component.axiom = axiom;
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button.properties['disabled']).toBeTruthy();
            component.values = ['value'];
            await fixture.isStable();
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on whether an expression has been entered', function() {
            component.axiom = axiom;
            component.tabIndex = 1;
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button.properties['disabled']).toBeTruthy();

            component.expression = 'test';
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on whether the expression editor is readOnly', async function() {
            this.expression = 'hello testing developer';
            element.queryAll(By.css('.mat-tab-label'))[1].triggerEventHandler('click', null);
            fixture.detectChanges();
            await fixture.isStable();
            component.editorOptions.readOnly = true;
            fixture.detectChanges();
            const codemirrorWrapper = element.queryAll(By.css('.codemirror-wrapper'))[0];
            expect(codemirrorWrapper.classes['readOnly']).toBeTrue();

            component.editorOptions.readOnly = false;
            fixture.detectChanges();
            expect(codemirrorWrapper.classes['readOnly']).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('should get the namespace of an axiom IRI', function() {
            expect(component.getIRINamespace(axiom)).toEqual('http://test.com/');
        });
        it('should get the localName of an axiom IRI', function() {
            expect(component.getIRILocalName(axiom)).toEqual('axiom');
        });
        describe('should add an axiom', function() {
            beforeEach(function() {
                component.values = ['value'];
                component.axiom = Object.assign({}, axiom);
                component.expression = 'PropA some ClassA';
                ontologyStateServiceStub.saveCurrentChanges.and.returnValue(of(null));
                propertyServiceStub.addId.and.returnValue(true);
            });
            describe('if adding a list', function() {
                beforeEach(function() {
                    component.tabIndex = 0;
                });
                describe('and the axiom is rdfs:range', function() {
                    beforeEach(function() {
                        component.axiom.iri = `${RDFS}range`;
                    });
                    it('unless a value is duplicated', function() {
                        propertyServiceStub.addId.and.returnValue(false);
                        component.addAxiom();
                        component.values.forEach(value => {
                            expect(propertyServiceStub.addId).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.selected, component.axiom.iri, value);
                        });
                        expect(ontologyStateServiceStub.addToAdditions).not.toHaveBeenCalled();
                        expect(ontologyStateServiceStub.updatePropertyIcon).not.toHaveBeenCalled();
                        expect(ontologyStateServiceStub.saveCurrentChanges).not.toHaveBeenCalled();
                        expect(matDialogRef.close).not.toHaveBeenCalled();
                        expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                    });
                    it('and at least one value was added', function() {
                        component.addAxiom();
                        component.values.forEach(value => {
                            expect(propertyServiceStub.addId).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.selected, component.axiom.iri, value);
                        });
                        expect(ontologyStateServiceStub.addToAdditions).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                        expect(ontologyStateServiceStub.updatePropertyIcon).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.selected);
                        expect(ontologyStateServiceStub.saveCurrentChanges).toHaveBeenCalledWith();
                        expect(matDialogRef.close).toHaveBeenCalledWith({axiom: component.axiom.iri, values: component.values});
                        expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                    });
                });
                describe('and the axiom is not rdfs:range', function() {
                    it('unless a value is duplicated', function() {
                        propertyServiceStub.addId.and.returnValue(false);
                        component.addAxiom();
                        component.values.forEach(value => {
                            expect(propertyServiceStub.addId).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.selected, component.axiom.iri, value);
                        });
                        expect(ontologyStateServiceStub.addToAdditions).not.toHaveBeenCalled();
                        expect(ontologyStateServiceStub.updatePropertyIcon).not.toHaveBeenCalled();
                        expect(ontologyStateServiceStub.saveCurrentChanges).not.toHaveBeenCalled();
                        expect(matDialogRef.close).not.toHaveBeenCalled();
                        expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                    });
                    it('and at least one value was added', function() {
                        component.addAxiom();
                        component.values.forEach(value => {
                            expect(propertyServiceStub.addId).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.selected, component.axiom.iri, value);
                        });
                        expect(ontologyStateServiceStub.addToAdditions).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                        expect(ontologyStateServiceStub.updatePropertyIcon).not.toHaveBeenCalled();
                        expect(ontologyStateServiceStub.saveCurrentChanges).toHaveBeenCalledWith();
                        expect(matDialogRef.close).toHaveBeenCalledWith({axiom: component.axiom.iri, values: component.values});
                        expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                    });
                });
            });
            describe('if adding an expression', function() {
                beforeEach(function() {
                    this.manchesterResult = {
                        errorMessage: '',
                        jsonld: []
                    };
                    component.tabIndex = 1;
                    manchesterConverterStub.manchesterToJsonld.and.returnValue(this.manchesterResult);
                    ontologyManagerServiceStub.isDataTypeProperty.and.returnValue(false);
                });
                it('unless the expression is invalid', function() {
                    this.manchesterResult.errorMessage = 'This is an error';
                    component.addAxiom();
                    expect(manchesterConverterStub.manchesterToJsonld).toHaveBeenCalledWith(component.expression, localNameMap, false);
                    expect(propertyServiceStub.addId).not.toHaveBeenCalled();
                    expect(ontologyStateServiceStub.addToAdditions).not.toHaveBeenCalled();
                    expect(ontologyStateServiceStub.updatePropertyIcon).not.toHaveBeenCalled();
                    expect(ontologyStateServiceStub.saveCurrentChanges).not.toHaveBeenCalled();
                    expect(component.errorMessage).toEqual('This is an error');
                    expect(matDialogRef.close).not.toHaveBeenCalled();
                });
                it('unless no blank nodes could be created', function() {
                    component.addAxiom();
                    expect(manchesterConverterStub.manchesterToJsonld).toHaveBeenCalledWith(component.expression, localNameMap, false);
                    expect(propertyServiceStub.addId).not.toHaveBeenCalled();
                    expect(ontologyStateServiceStub.addToAdditions).not.toHaveBeenCalled();
                    expect(ontologyStateServiceStub.updatePropertyIcon).not.toHaveBeenCalled();
                    expect(ontologyStateServiceStub.saveCurrentChanges).not.toHaveBeenCalled();
                    expect(component.errorMessage).toBeTruthy();
                    expect(matDialogRef.close).not.toHaveBeenCalled();
                });
                describe('and blank nodes were created', function() {
                    beforeEach(function() {
                        this.blankNodes = [{'@id': 'bnode1'}, {'@id': 'bnode2'}];
                        this.manchesterResult.jsonld = this.blankNodes;
                    });
                    it('and the axiom is rdfs:range', function() {
                        component.axiom.iri = `${RDFS}range`;
                        component.addAxiom();
                        expect(manchesterConverterStub.manchesterToJsonld).toHaveBeenCalledWith(component.expression, localNameMap, false);
                        expect(propertyServiceStub.addId).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.selected, component.axiom.iri, this.blankNodes[0]['@id']);
                        this.blankNodes.forEach(node => {
                            expect(ontologyStateServiceStub.addToAdditions).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.versionedRdfRecord.recordId, {'@id': node['@id']});
                        });
                        expect(ontologyStateServiceStub.updatePropertyIcon).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.selected);
                        expect(ontologyStateServiceStub.saveCurrentChanges).toHaveBeenCalledWith();
                        expect(matDialogRef.close).toHaveBeenCalledWith({axiom: component.axiom.iri, values: []});
                    });
                    it('and the axiom is not rdfs:range', function() {
                        component.addAxiom();
                        expect(manchesterConverterStub.manchesterToJsonld).toHaveBeenCalledWith(component.expression, localNameMap, false);
                        expect(propertyServiceStub.addId).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.selected, component.axiom.iri, this.blankNodes[0]['@id']);
                        this.blankNodes.forEach(function(node) {
                            expect(ontologyStateServiceStub.addToAdditions).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.versionedRdfRecord.recordId, {'@id': node['@id']});
                        });
                        expect(ontologyStateServiceStub.updatePropertyIcon).not.toHaveBeenCalled();
                        expect(ontologyStateServiceStub.saveCurrentChanges).toHaveBeenCalledWith();
                        expect(matDialogRef.close).toHaveBeenCalledWith({axiom: component.axiom.iri, values: []});
                    });
                });
            });
        });
    });
    it('should call the correct methods when the Add button is clicked', function() {
        component.axiom = axiom;
        component.values = ['value'];
        spyOn(component, 'addAxiom');
        fixture.detectChanges();

        const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        button.triggerEventHandler('click', null);
        expect(component.addAxiom).toHaveBeenCalledWith();
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(false);
    });
});
