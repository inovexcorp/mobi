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
import { By } from '@angular/platform-browser';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { StatementContainerComponent } from './statementContainer.component';

describe('Statement Container component', function() {
    let component: StatementContainerComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<StatementContainerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
            declarations: [
                StatementContainerComponent
            ],
            providers: [],
        }).compileComponents();

        fixture = TestBed.createComponent(StatementContainerComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        fixture = null;
        element = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.statement-container')).length).toEqual(1);
        });
        it('without a h5', function() {
            expect(element.queryAll(By.css('h5')).length).toEqual(0);
        });
        it('with a h5 when additions attribute is set', async function() {
            component.additions = true;
            component.ngOnInit();
            await fixture.detectChanges();
            expect(element.queryAll(By.css('.additions')).length).toEqual(1);
            const h5 = element.queryAll(By.css('h5'));
            expect(h5.length).toEqual(1);
            expect(h5[0].nativeElement.innerHTML).toEqual('Added Statements');
        });
        it('with a h5 when deletions attribute is set', async function() {
            component.deletions = true;
            component.ngOnInit();
            await fixture.detectChanges();
            expect(element.queryAll(By.css('.deletions')).length).toEqual(1);
            const h5 = element.queryAll(By.css('h5'));
            expect(h5.length).toEqual(1);
            expect(h5[0].nativeElement.innerHTML).toEqual('Deleted Statements');
        });
    });
});
