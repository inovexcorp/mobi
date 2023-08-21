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
import { MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { SharedModule } from '../../../shared/shared.module';
import { RecordIconComponent } from './recordIcon.component';

describe('Record Icon component', function() {
    let component: RecordIconComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RecordIconComponent>;
    let catalogStateStub: jasmine.SpyObj<CatalogStateService>;

    const record: JSONLDObject = {'@id': '', '@type': []};

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                RecordIconComponent
            ],
            providers: [
                MockProvider(CatalogStateService)
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RecordIconComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogStateStub = TestBed.inject(CatalogStateService) as jasmine.SpyObj<CatalogStateService>;

        catalogStateStub.getRecordIcon.and.returnValue('fa-book');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogStateStub = null;
    });

    it('should initialize correct on record change', function() {
        component.record = record;
        expect(catalogStateStub.getRecordIcon).toHaveBeenCalledWith(record);
        expect(component.icon).toEqual('fa-book');
    });
    describe('contains the correct html', function() {
        it('if icon is material', function() {
            component.isMaterial = true;
            component.icon = 'home';
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-icon')).length).toBe(1);
        });
        describe('if icon is not material', function() {
            beforeEach(function() {
                component.isMaterial = false;
            });
            it('with a square icon', function() {
                fixture.detectChanges();
                expect(element.queryAll(By.css('.fa-square')).length).toBe(1);
            });
            it('with an icon for the record', function() {
                component.record = record;
                fixture.detectChanges();
                expect(element.queryAll(By.css('.fa-book')).length).toBe(1);
            });
        });
    });
});
