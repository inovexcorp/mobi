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

import { DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { configureTestSuite } from "ng-bullet";
import { cleanStylesFromDOM } from "../../../../../../test/ts/Shared";
import { BreadcrumbsComponent } from "./breadcrumbs.component";


describe('Breadcrumbs component', function() {
    let component: BreadcrumbsComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<BreadcrumbsComponent>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [  ],
            declarations: [
                BreadcrumbsComponent,
            ],
            providers: [ ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(BreadcrumbsComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.items = ['', '', ''];
        spyOn(component.onClick, 'emit');
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('should initialize with the correct value for', function() {
        it('items', function() {
            expect(component.items).toEqual(['', '', '']);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('ol.breadcrumbs')).length).toEqual(1);
            expect(element.queryAll(By.css('.breadcrumb')).length).toEqual(1);
        });
        it('depending on how many entities are in the path', function() {
            expect(element.queryAll(By.css('li')).length).toEqual(3);
        });
        it('depending on whether an entity is the last in the list', function() {
            const items = element.queryAll(By.css('li'));
            expect(items[0].nativeElement.classList.contains('active')).toEqual(false);
            expect(items[0].queryAll(By.css('span')).length).toEqual(0);
            expect(items[0].queryAll(By.css('a')).length).toEqual(1);

            expect(items[1].nativeElement.classList.contains('active')).toEqual(false);
            expect(items[1].queryAll(By.css('span')).length).toEqual(0);
            expect(items[1].queryAll(By.css('a')).length).toEqual(1);

            expect(items[2].nativeElement.classList.contains('active')).toEqual(true);
            expect(items[2].queryAll(By.css('span')).length).toEqual(1);
            expect(items[2].queryAll(By.css('a')).length).toEqual(0);
        });
    });
    it('contains the correct html and handle click events', function() {
        const items = element.queryAll(By.css('li'));
        items[0].queryAll(By.css('a'))[0].nativeElement.dispatchEvent(new Event('click'));
        expect(component.onClick.emit).toHaveBeenCalledWith(0);

        items[1].queryAll(By.css('a'))[0].nativeElement.dispatchEvent(new Event('click'));
        expect(component.onClick.emit).toHaveBeenCalledWith(1);
    });
});
