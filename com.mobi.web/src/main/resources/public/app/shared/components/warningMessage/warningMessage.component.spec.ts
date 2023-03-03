/*-
* #%L
 * com.mobi.web
 *  $Id:$
 *  $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *  
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
*/

import { WarningMessageComponent } from './warningMessage.component';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';

describe('Warning Message component', function() {
    let component: WarningMessageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<WarningMessageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
            declarations: [
                WarningMessageComponent
            ],
            providers: []
        }).compileComponents();

        fixture = TestBed.createComponent(WarningMessageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping-containers', function() {
            expect(element.queryAll(By.css('.warning-message')).length).toEqual(1);
            expect(element.queryAll(By.css('.text-warning')).length).toEqual(1);
        });
        it('with a i.fa-warning', function() {
            expect(element.queryAll(By.css('i')).length).toEqual(1);
            expect(element.queryAll(By.css('i.fa-warning')).length).toEqual(1);
        });
    });
});
