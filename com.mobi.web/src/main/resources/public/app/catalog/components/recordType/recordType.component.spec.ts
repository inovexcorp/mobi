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
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { UtilService } from '../../../shared/services/util.service';
import { SharedModule } from '../../../shared/shared.module';
import { RecordTypeComponent } from './recordType.component';

describe('Record Type component', function() {
    let component: RecordTypeComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RecordTypeComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                RecordTypeComponent
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(UtilService),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RecordTypeComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;

        catalogManagerStub.coreRecordTypes = ['core'];
        catalogManagerStub.recordTypes = ['core', 'typeA', 'typeB'];
        utilStub.getBeautifulIRI.and.callFake(a => a);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogManagerStub = null;
        utilStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.record-type')).length).toEqual(1);
        });
    });
});
