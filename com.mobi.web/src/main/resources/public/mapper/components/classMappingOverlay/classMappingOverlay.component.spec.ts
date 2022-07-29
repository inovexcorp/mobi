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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatDialogModule, MatDialogRef } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { ClassPreviewComponent } from '../classPreview/classPreview.component';
import { ClassSelectComponent } from '../classSelect/classSelect.component';
import { ClassMappingOverlayComponent } from './classMappingOverlay.component';

describe('Class Mapping Overlay component', function() {
    let component: ClassMappingOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ClassMappingOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<ClassMappingOverlayComponent>>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;

    const classMapping: JSONLDObject = {'@id': 'classMapping'};
    const mappingClass: MappingClass = {
        ontologyId: '',
        classObj: {'@id': 'classId'},
        name: '',
        isDeprecated: false
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatDialogModule,
                MatButtonModule
            ],
            declarations: [
                ClassMappingOverlayComponent,
                MockComponent(ClassSelectComponent),
                MockComponent(ClassPreviewComponent)
            ],
            providers: [
                MockProvider(MapperStateService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        mapperStateStub = TestBed.get(MapperStateService);
        mapperStateStub.availableClasses = [];
        fixture = TestBed.createComponent(ClassMappingOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        mapperStateStub = null;
    });

    it('should initialize the form correctly', function() {
        expect(component.classMappingForm.controls.class.disabled).toBeTrue();
    });
    describe('controller methods', function() {
        describe('should add a class mapping', function() {
            beforeEach(function() {
                component.selectedClass = mappingClass;
                mapperStateStub.addClassMapping.and.returnValue(classMapping);
            });
            it('if there are properties set already', function() {
                mapperStateStub.hasPropsSet.and.returnValue(true);
                component.addClass();
                expect(mapperStateStub.addClassMapping).toHaveBeenCalledWith(component.selectedClass);
                expect(mapperStateStub.setProps).not.toHaveBeenCalled();
                expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                expect(matDialogRef.close).toHaveBeenCalledWith(classMapping);
            });
            it('if no properties have been set yet', function() {
                mapperStateStub.hasPropsSet.and.returnValue(false);
                component.addClass();
                expect(mapperStateStub.addClassMapping).toHaveBeenCalledWith(component.selectedClass);
                expect(mapperStateStub.setProps).toHaveBeenCalledWith('classId');
                expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                expect(matDialogRef.close).toHaveBeenCalledWith(classMapping);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with a class-select', function() {
            expect(element.queryAll(By.css('class-select')).length).toEqual(1);
        });
        it('depending on whether a class is selected', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button.properties['disabled']).toBeTruthy();
            expect(element.queryAll(By.css('class-preview')).length).toEqual(0);

            component.selectedClass = mappingClass;
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
            expect(element.queryAll(By.css('class-preview')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call addClass when the button is clicked', function() {
        component.selectedClass = mappingClass;
        fixture.detectChanges();
        spyOn(component, 'addClass');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.addClass).toHaveBeenCalledWith();
    });
});
