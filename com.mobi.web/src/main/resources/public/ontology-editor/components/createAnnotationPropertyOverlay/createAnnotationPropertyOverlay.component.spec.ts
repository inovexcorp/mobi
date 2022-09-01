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
import { MatButtonModule, MatDialogModule, MatDialogRef, MatFormFieldModule, MatIconModule, MatInputModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DCTERMS, OWL } from '../../../prefixes';
import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { StaticIriComponent } from '../staticIri/staticIri.component';
import { CustomLabelComponent } from '../../../shared/components/customLabel/customLabel.component';
import { AdvancedLanguageSelectComponent } from '../advancedLanguageSelect/advancedLanguageSelect.component';
import { HierarchyNode } from '../../../shared/models/hierarchyNode.interface';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { CreateAnnotationPropertyOverlayComponent } from './createAnnotationPropertyOverlay.component';

describe('Create Annotation Overlay component', function() {
    let component: CreateAnnotationPropertyOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CreateAnnotationPropertyOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateAnnotationPropertyOverlayComponent>>;
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
                MatIconModule
            ],
            declarations: [
                CreateAnnotationPropertyOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(StaticIriComponent),
                MockComponent(CustomLabelComponent),
                MockComponent(AdvancedLanguageSelectComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close']) },
                { provide: CamelCasePipe, useClass: MockPipe(CamelCasePipe) },
                { provide: SplitIRIPipe, useClass: MockPipe(SplitIRIPipe) },
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CreateAnnotationPropertyOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        camelCaseStub = TestBed.get(CamelCasePipe);
        matDialogRef = TestBed.get(MatDialogRef);
        ontologyStateServiceStub = TestBed.get(OntologyStateService);

        ontologyStateServiceStub.saveCurrentChanges.and.returnValue(of([]));
        ontologyStateServiceStub.getDefaultPrefix.and.returnValue(iri);
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
        expect(component.property['@type']).toEqual([OWL + 'AnnotationProperty']);
        expect(component.property[DCTERMS + 'title']).toEqual([{'@value': ''}]);
        expect(component.property[DCTERMS + 'description']).toEqual(undefined);

        component.createForm.controls.description.setValue('test1');
        fixture.detectChanges();
        expect(component.property[DCTERMS + 'description']).toEqual([{'@value': 'test1'}]);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['static-iri', 'textarea', 'advanced-language-select'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
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
        it('create calls the correct manager functions', fakeAsync(function() {
            const propIri = 'property-iri';
            spyOn(component, 'nameChanged');
            component.ngOnInit();
            const hierarchyNode: HierarchyNode = {
                entityIRI: propIri,
                hasChildren: false,
                indent: 1,
                path: ['path1', 'path2'],
                entityInfo: {label: 'label', names: ['name']},
                joinedPath: 'path1path2',
            };
            ontologyStateServiceStub.flattenHierarchy.and.returnValue([hierarchyNode]);
            component.createForm.controls.iri.setValue(propIri);
            component.createForm.controls.title.setValue('label');
            component.createForm.controls.description.setValue('description');
            component.create();
            tick();
            expect(ontologyStateServiceStub.addLanguageToNewEntity).toHaveBeenCalledWith(component.property, component.createForm.controls.language.value);
            expect(ontologyStateServiceStub.updatePropertyIcon).toHaveBeenCalledWith(component.property);
            expect(ontologyStateServiceStub.addEntity).toHaveBeenCalledWith(component.property);
            expect(ontologyStateServiceStub.listItem.annotations.iris).toEqual({[propIri]: ontologyStateServiceStub.listItem.ontologyId});
            expect(ontologyStateServiceStub.listItem.annotations.flat).toEqual([hierarchyNode]);
            expect(ontologyStateServiceStub.addToAdditions).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.versionedRdfRecord.recordId, component.property);
            expect(ontologyStateServiceStub.flattenHierarchy).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.annotations);
            expect(ontologyStateServiceStub.saveCurrentChanges).toHaveBeenCalledWith();
            expect(matDialogRef.close).toHaveBeenCalledWith();
            expect(ontologyStateServiceStub.openSnackbar).toHaveBeenCalledWith(propIri);
        }));
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