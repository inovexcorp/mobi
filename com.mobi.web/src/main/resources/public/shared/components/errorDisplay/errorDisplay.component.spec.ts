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
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { ErrorDisplayComponent } from './errorDisplay.component';
import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';

describe('Error Display component', function() {
    let element: DebugElement;
    let fixture: ComponentFixture<ErrorDisplayComponent>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            declarations: [
                ErrorDisplayComponent
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ErrorDisplayComponent);
        element = fixture.debugElement;
    });

    afterAll(function() {
        cleanStylesFromDOM();
        element = null;
        fixture = null;
    })

    describe('contains the correct html', function() {
        it('for wrapping-containers', function() {
            expect(element.query(By.css('.error-display'))).toBeDefined();
        });
        it('with a i.fa-exclamation-triangle', function() {
            expect(element.query(By.css('i.fa-exclamation-triangle'))).toBeDefined();
        });
        it('with a span', function() {
            expect(element.query(By.css('span'))).toBeDefined();
        });
    });
});