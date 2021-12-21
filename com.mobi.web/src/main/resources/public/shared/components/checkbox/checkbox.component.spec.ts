/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { FormsModule } from '@angular/forms';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { CheckboxComponent } from './checkbox.component';

describe('Checkbox component', function() {
    let component: CheckboxComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CheckboxComponent>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                FormsModule,
                MatCheckboxModule
            ],
            declarations: [
                CheckboxComponent
            ],
            providers: []
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CheckboxComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.model = false;
        component.displayText = '';
        component.isDisabled = false;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('should initialize with the correct data for', function() {
        it('model', function() {
            expect(component.model).toEqual(false);
        });
        it('displayText', function() {
            expect(component.displayText).toEqual('');
        });
        it('isDisabled', function() {
            expect(component.isDisabled).toEqual(false);
        });
    });
    describe('controller methods', function() {
        it('should emit a change', fakeAsync(() => {
            spyOn(component.modelChange, 'emit');
            component.model = true;
            const event = {
                source: undefined,
                checked: true
            } as MatCheckboxChange;
            component.onChange(event);
            tick(500);
            expect(component.modelChange.emit).toHaveBeenCalledWith(true);
        }));
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.checkbox')).length).toEqual(1);
        });
        it('with a mat checkbox ', function() {
            expect(element.queryAll(By.css('mat-checkbox input')).length).toEqual(1);
        });
        it('depending on whether it should be disabled', async function() {
            fixture.detectChanges();
            await fixture.whenStable();
            const checkbox = element.queryAll(By.css('mat-checkbox'))[0];

            expect(checkbox.classes['mat-checkbox-disabled']).toBeFalse();
            component.isDisabled = true;
            fixture.detectChanges();
            await fixture.whenStable();

            expect(checkbox.classes['mat-checkbox-disabled']).toBeTrue();
        });
    });
});