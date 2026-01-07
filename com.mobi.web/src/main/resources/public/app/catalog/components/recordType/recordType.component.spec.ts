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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { RecordTypeComponent } from './recordType.component';

describe('Record Type component', function() {
    let component: RecordTypeComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RecordTypeComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;

    const recordType = 'http://test.com#typeA';
    const record: JSONLDObject = {
        '@id': 'recordId',
        '@type': [ recordType ]
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                RecordTypeComponent
            ],
            providers: [
                MockProvider(CatalogManagerService),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RecordTypeComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        catalogManagerStub.getType.and.returnValue(recordType);
        component.record = record;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogManagerStub = null;
    });

    it('initializes correctly on record change', function() {
        expect(component.type).toEqual('Type A');
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.record-type')).length).toEqual(1);
        });
        it('with the appropriate type display', function() {
            fixture.detectChanges();
            expect(element.nativeElement.innerHTML).toContain('Type A');
        });
    });
});
