/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { MockProvider } from 'ng-mocks';

import { 
    cleanStylesFromDOM
 } from '../../../../../../public/test/ts/Shared';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { SharedModule } from '../../../../shared/shared.module';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { NewInstancePropertyOverlayComponent } from './newInstancePropertyOverlay.component';

describe('New Instance Property Overlay component', function() {
    let component: NewInstancePropertyOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<NewInstancePropertyOverlayComponent>;
    let exploreUtilsStub: jasmine.SpyObj<ExploreUtilsService>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<NewInstancePropertyOverlayComponent>>;

    const data = {
        properties: [{
            propertyIRI: 'test',
            type: 'testType',
            range: ['testRange'],
            restrictions: [{ cardinality: 0, cardinalityType: 'cardinalityString'}]
        }], instance: {}};

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [  
                SharedModule
             ],
            declarations: [
                NewInstancePropertyOverlayComponent,
            ],
            providers: [
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                { provide: MAT_DIALOG_DATA, useValue: data },
                MockProvider(ToastService),
                MockProvider(PolicyEnforcementService),
                MockProvider(ExploreUtilsService),
                MockProvider(MatDialog),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(NewInstancePropertyOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<NewInstancePropertyOverlayComponent>>;
        exploreUtilsStub = TestBed.inject(ExploreUtilsService) as jasmine.SpyObj<ExploreUtilsService>;
        exploreUtilsStub.getNewProperties.and.returnValue([{
            propertyIRI: 'test',
            type: 'testType',
            range: ['testRange'],
            restrictions: [{ cardinality: 0, cardinalityType: 'cardinalityString'}]
        }]);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        exploreUtilsStub = null;
        matDialogRef = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1.mat-dialog-title')).length).withContext('title').toEqual(1);
            expect(element.queryAll(By.css('div.mat-dialog-content')).length).withContext('content').toEqual(1);
            expect(element.queryAll(By.css('div.mat-dialog-actions')).length).withContext('actions').toEqual(1);
        });
        ['h1', 'mat-form-field', 'input', 'mat-autocomplete'].forEach(test => {
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
    });
    describe('controller methods', function() {
        it('should get the list of properties', fakeAsync(function() {
            component.ngOnInit();
            fixture.detectChanges();

            component.propertyControl.setValue('text');
            component.propertyControl.updateValueAndValidity();
            tick(1000);
            fixture.detectChanges();
            component.filteredProperties.subscribe(() => {
                expect(component.data.properties).toEqual([{
                    propertyIRI: 'test',
                    type: 'testType',
                    range: ['testRange'],
                    restrictions: [{ cardinality: 0, cardinalityType: 'cardinalityString'}]
                }]);

                expect(exploreUtilsStub.getNewProperties).toHaveBeenCalledWith([{
                    propertyIRI: 'test',
                    type: 'testType',
                    range: ['testRange'],
                    restrictions: [{ cardinality: 0, cardinalityType: 'cardinalityString'}]
                }], component.data.instance, 'text');
            });
        }));
        it('should submit the modal adding the property to the instance', function() {
            component.selectedProperty = {
                propertyIRI: 'www.test.com',
                type: 'testType',
                range: ['testRange'],
                restrictions: [{ cardinality: 0, cardinalityType: 'cardinalityString'}]
            };
            component.submit();
            expect(component.data.instance[component.selectedProperty.propertyIRI]).toEqual([]);
            expect(matDialogRef.close).toHaveBeenCalledWith(component.selectedProperty);
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
});
