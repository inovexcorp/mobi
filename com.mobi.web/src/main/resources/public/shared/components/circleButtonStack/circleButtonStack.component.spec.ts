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
import { MatButtonModule, MatIconModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';

import { 
    cleanStylesFromDOM
 } from '../../../../../../test/ts/Shared';

import { CircleButtonStackComponent } from './circleButtonStack.component';

describe('Circle Button Stack component', function() {
    let component: CircleButtonStackComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CircleButtonStackComponent>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ 
                MatIconModule,
                MatButtonModule
            ],
            declarations: [
                CircleButtonStackComponent,
            ],
            providers: [ ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CircleButtonStackComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
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
            // expect(element.queryAll(By.css('.hidden-buttons')[0]).children().length).toEqual(1);
        });
    });
});
