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
import { MockComponent, MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { SharedModule } from '../../../shared/shared.module';
import { EditMappingTabComponent } from '../editMappingTab/editMappingTab.component';
import { MappingCommitsTabComponent } from '../mappingCommitsTab/mappingCommitsTab.component';
import { RdfPreviewTabComponent } from '../rdfPreviewTab/rdfPreviewTab.component';
import { EditMappingPageComponent } from './editMappingPage.component';

describe('Edit Mapping Page component', function() {
    let component: EditMappingPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditMappingPageComponent>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                SharedModule
             ],
            declarations: [
                EditMappingPageComponent,
                MockComponent(EditMappingTabComponent),
                MockComponent(RdfPreviewTabComponent),
                MockComponent(MappingCommitsTabComponent),
            ],
            providers: [
                MockProvider(MapperStateService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(EditMappingPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mapperStateStub = null;
    });

    describe('contains the correct html', function() {
        beforeEach(function() {
            fixture.detectChanges();
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.edit-mapping-page')).length).toBe(1);
        });
        it('with a mat-tab-group', function() {
            expect(element.queryAll(By.css('mat-tab-group')).length).toBe(1);
        });
        it('with tabs for each page', function() {
            expect(element.queryAll(By.css('mat-tab-body')).length).toBe(3);
        });
        it('with a tab for edit-mapping-tab', function() {
            expect(element.queryAll(By.css('edit-mapping-tab')).length).toBe(1);
        });
        it('with a tab for rdf-preview-tab', async function() {
            mapperStateStub.editTabIndex = 1;
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('rdf-preview-tab')).length).toBe(1);
        });
        it('with a tab for mapping-commits-tab', async function() {
            mapperStateStub.editTabIndex = 2;
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('mapping-commits-tab')).length).toBe(1);
        });
    });
});
