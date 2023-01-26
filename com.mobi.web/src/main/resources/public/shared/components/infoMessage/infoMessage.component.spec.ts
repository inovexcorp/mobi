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
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { InfoMessageComponent } from './infoMessage.component';

describe('Info Message component', function() {
    let element: DebugElement;
    let fixture: ComponentFixture<InfoMessageComponent>;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            declarations: [
                InfoMessageComponent
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(InfoMessageComponent);
        element = fixture.debugElement;
    });

    afterEach(function() {
        fixture = null;
        element = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping-containers', function() {
            expect(element.queryAll(By.css('.info-message')).length).toEqual(1);
            expect(element.queryAll(By.css('.text-info')).length).toEqual(1);
        });
        it('with a i.fa-info', function() {
            var item = element.query(By.css('i'));
            expect(item).toBeTruthy();
            expect(item.attributes.class.includes('fa-info')).toBeTruthy();
        });
    });
});
