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
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';

import { 
    cleanStylesFromDOM
 } from '../../../../../public/test/ts/Shared';
import { CircleButtonStackComponent } from './circleButtonStack.component';

@Component({
    template: `<circle-button-stack>
      <button>A</button>
    </circle-button-stack>`
})
class TestCircleButtonStackComponent {}

describe('Circle Button Stack component', function() {
    let element: DebugElement;
    let fixture: ComponentFixture<CircleButtonStackComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                MatIconModule,
                MatButtonModule
            ],
            declarations: [
                CircleButtonStackComponent,
                TestCircleButtonStackComponent
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CircleButtonStackComponent);
        element = fixture.debugElement;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        element = null;
        fixture = null;
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.circle-button-stack')).length).toEqual(1);
        });
        it('with a .hidden-buttons', function() {
            expect(element.queryAll(By.css('.hidden-buttons')).length).toBe(1);
        });
        it('with a button.btn-float', function() {
            expect(element.queryAll(By.css('button.btn-float')).length).toBe(1);
        });
        it('with transcluded content', function() {
            const testFixture = TestBed.createComponent(TestCircleButtonStackComponent);
            testFixture.detectChanges();
            const testElement = testFixture.debugElement;
            expect(testElement.query(By.css('.hidden-buttons')).children.length).toEqual(1);
        });
    });
});
