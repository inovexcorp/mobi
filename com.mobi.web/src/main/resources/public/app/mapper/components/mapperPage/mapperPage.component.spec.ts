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

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { EditMappingPageComponent } from '../editMappingPage/editMappingPage.component';
import { FileUploadPageComponent } from '../fileUploadPage/fileUploadPage.component';
import { MappingSelectPageComponent } from '../mappingSelectPage/mappingSelectPage.component';
import { MapperPageComponent } from './mapperPage.component';

describe('Mapper Page component', function() {
    let component: MapperPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MapperPageComponent>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
            declarations: [
                MapperPageComponent,
                MockComponent(MappingSelectPageComponent),
                MockComponent(FileUploadPageComponent),
                MockComponent(EditMappingPageComponent)
            ],
            providers: [
                MockProvider(MapperStateService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MapperPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;

        mapperStateStub.selectMappingStep = 0;
        mapperStateStub.fileUploadStep = 1;
        mapperStateStub.editMappingStep = 2;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mapperStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.mapper-page')).length).toEqual(1);
        });
        describe('if the step', function() {
            it('is selecting a mapping', function() {
                mapperStateStub.step = mapperStateStub.selectMappingStep;
                fixture.detectChanges();
                expect(element.queryAll(By.css('mapping-select-page')).length).toEqual(1);
            });
            it('is uploading a file', function() {
                mapperStateStub.step = mapperStateStub.fileUploadStep;
                fixture.detectChanges();
                expect(element.queryAll(By.css('file-upload-page')).length).toEqual(1);
            });
            it('is editing a mapping', function() {
                mapperStateStub.step = mapperStateStub.editMappingStep;
                fixture.detectChanges();
                expect(element.queryAll(By.css('edit-mapping-page')).length).toEqual(1);
            });
        });
    });
});
