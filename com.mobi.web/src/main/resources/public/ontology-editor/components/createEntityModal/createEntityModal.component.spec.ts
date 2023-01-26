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
import { MatButtonModule, MatDialog, MatDialogModule, MatDialogRef, MatFormFieldModule, MatIconModule, MatInputModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CreateAnnotationPropertyOverlayComponent } from '../createAnnotationPropertyOverlay/createAnnotationPropertyOverlay.component';
import { CreateClassOverlayComponent } from '../createClassOverlay/createClassOverlay.component';
import { CreateConceptOverlayComponent } from '../createConceptOverlay/createConceptOverlay.component';
import { CreateConceptSchemeOverlayComponent } from '../createConceptSchemeOverlay/createConceptSchemeOverlay.component';
import { CreateDataPropertyOverlayComponent } from '../createDataPropertyOverlay/createDataPropertyOverlay.component';
import { CreateIndividualOverlayComponent } from '../createIndividualOverlay/createIndividualOverlay.component';
import { CreateObjectPropertyOverlayComponent } from '../createObjectPropertyOverlay/createObjectPropertyOverlay.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { CreateEntityModalComponent } from './createEntityModal.component';

describe('Create Entity Modal component', function() {
    let component: CreateEntityModalComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CreateEntityModalComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateEntityModalComponent>>;
    let matDialogStub: jasmine.SpyObj<MatDialog>;
    let ontologyStateServiceStub: jasmine.SpyObj<OntologyStateService>;
    
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
                CreateEntityModalComponent,
                MockComponent(CreateAnnotationPropertyOverlayComponent),
                MockComponent(CreateClassOverlayComponent),
                MockComponent(CreateConceptOverlayComponent),
                MockComponent(CreateConceptSchemeOverlayComponent),
                MockComponent(CreateDataPropertyOverlayComponent),
                MockComponent(CreateIndividualOverlayComponent),
                MockComponent(CreateObjectPropertyOverlayComponent),
            ],
            providers: [
                MockProvider(MatDialog),
                MockProvider(OntologyStateService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CreateEntityModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
        matDialogStub = TestBed.get(MatDialog);
        ontologyStateServiceStub = TestBed.get(OntologyStateService);
        ontologyStateServiceStub.listItem = new OntologyListItem();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        matDialogStub = null;
        ontologyStateServiceStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['button.create-class', 'button.create-data-property', 'button.create-object-property', 'button.create-annotation-property', 'button.create-individual'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        ['button.create-concept', 'button.create-concept-scheme'].forEach(test => {
            it('with a ' + test + ' if the ontology is a vocabulary', function() {
                expect(element.queryAll(By.css(test)).length).toEqual(0);
    
                ontologyStateServiceStub.listItem.isVocabulary = true;
                fixture.detectChanges();
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with a button to cancel', function() {
            const cancelButtons = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))
            expect(cancelButtons.length).toEqual(1);
            expect(cancelButtons[0].nativeElement.textContent.trim()).toEqual('Cancel');
        });
    });
    describe('controller methods', function() {
        it('should open the modal for creating a class', function() {
            component.createClass();
            expect(matDialogRef.close).toHaveBeenCalledWith();
            expect(matDialogStub.open).toHaveBeenCalledWith(CreateClassOverlayComponent);
        });
        it('should open the modal for creating a data property', function() {
            component.createDataProperty();
            expect(matDialogRef.close).toHaveBeenCalledWith();
            expect(matDialogStub.open).toHaveBeenCalledWith(CreateDataPropertyOverlayComponent);
        });
        it('should open the modal for creating an object property', function() {
            component.createObjectProperty();
            expect(matDialogRef.close).toHaveBeenCalledWith();
            expect(matDialogStub.open).toHaveBeenCalledWith(CreateObjectPropertyOverlayComponent);
        });
        it('should open the modal for creating an annotation property', function() {
            component.createAnnotationProperty();
            expect(matDialogRef.close).toHaveBeenCalledWith();
            expect(matDialogStub.open).toHaveBeenCalledWith(CreateAnnotationPropertyOverlayComponent);
        });
        it('should open the modal for creating an individual', function() {
            component.createIndividual();
            expect(matDialogRef.close).toHaveBeenCalledWith();
            expect(matDialogStub.open).toHaveBeenCalledWith(CreateIndividualOverlayComponent);
        });
        it('should open the modal for creating a concept', function() {
            component.createConcept();
            expect(matDialogRef.close).toHaveBeenCalledWith();
            expect(matDialogStub.open).toHaveBeenCalledWith(CreateConceptOverlayComponent);
        });
        it('should open the modal for creating a concept scheme', function() {
            component.createConceptScheme();
            expect(matDialogRef.close).toHaveBeenCalledWith();
            expect(matDialogStub.open).toHaveBeenCalledWith(CreateConceptSchemeOverlayComponent);
        });
    });
    it('should call createClass when the button is clicked', function() {
        spyOn(component, 'createClass');
        const button = element.queryAll(By.css('button.create-class'))[0];
        button.nativeElement.click();
        expect(component.createClass).toHaveBeenCalledWith();
    });
    it('should call createDataProperty when the button is clicked', function() {
        spyOn(component, 'createDataProperty');
        const button = (element.queryAll(By.css('button.create-data-property'))[0]);
        button.nativeElement.click()
        expect(component.createDataProperty).toHaveBeenCalledWith();
    });
    it('should call createObjectProperty when the button is clicked', function() {
        spyOn(component, 'createObjectProperty');
        const button = (element.queryAll(By.css('button.create-object-property'))[0]);
        button.nativeElement.click()
        expect(component.createObjectProperty).toHaveBeenCalledWith();
    });
    it('should call createAnnotationProperty when the button is clicked', function() {
        spyOn(component, 'createAnnotationProperty');
        const button = (element.queryAll(By.css('button.create-annotation-property'))[0]);
        button.nativeElement.click()
        expect(component.createAnnotationProperty).toHaveBeenCalledWith();
    });
    it('should call createIndividual when the button is clicked', function() {
        spyOn(component, 'createIndividual');
        const button = (element.queryAll(By.css('button.create-individual'))[0]);
        button.nativeElement.click()
        expect(component.createIndividual).toHaveBeenCalledWith();
    });
    it('should call createConcept when the button is clicked', function() {
        ontologyStateServiceStub.listItem.isVocabulary = true;
        fixture.detectChanges();
        spyOn(component, 'createConcept');
        const button = (element.queryAll(By.css('button.create-concept'))[0]);
        button.nativeElement.click()
        expect(component.createConcept).toHaveBeenCalledWith();
    });
    it('should call createConceptScheme when the button is clicked', function() {
        ontologyStateServiceStub.listItem.isVocabulary = true;
        fixture.detectChanges();
        spyOn(component, 'createConceptScheme');
        const button = (element.queryAll(By.css('button.create-concept-scheme'))[0]);
        button.nativeElement.click()
        expect(component.createConceptScheme).toHaveBeenCalledWith();
    });
});
