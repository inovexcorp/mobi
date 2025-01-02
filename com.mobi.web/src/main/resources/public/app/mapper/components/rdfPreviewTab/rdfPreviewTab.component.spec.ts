/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { MockComponent, MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { Mapping } from '../../../shared/models/mapping.class';
import { MapperSerializationSelectComponent } from '../mapperSerializationSelect/mapperSerializationSelect.component';
import { PreviewDataGridComponent } from '../previewDataGrid/previewDataGrid.component';
import { Difference } from '../../../shared/models/difference.class';
import { RdfPreviewTabComponent } from './rdfPreviewTab.component';

describe('RDF Preview tab component', function() {
    let component: RdfPreviewTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RdfPreviewTabComponent>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;

    const error = 'Error message';

    let mappingStub: jasmine.SpyObj<Mapping>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                MatButtonModule,
                FormsModule,
                ReactiveFormsModule
             ],
            declarations: [
                RdfPreviewTabComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(MapperSerializationSelectComponent),
                MockComponent(CodemirrorComponent),
                MockComponent(PreviewDataGridComponent),
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(DelimitedManagerService),
            ]
        });
    });

    beforeEach(function() {
        delimitedManagerStub = TestBed.inject(DelimitedManagerService) as jasmine.SpyObj<DelimitedManagerService>; // Done first so it's set before the component initializes
        delimitedManagerStub.serializeFormat = '';
        delimitedManagerStub.preview = '';

        fixture = TestBed.createComponent(RdfPreviewTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;

        mappingStub = jasmine.createSpyObj('Mapping', [
            'getJsonld'
        ]);
        mappingStub.getJsonld.and.returnValue([]);
        mapperStateStub.selected = {
            mapping: mappingStub,
            difference: new Difference(),
            config: {
                title: ''
            }
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mapperStateStub = null;
        delimitedManagerStub = null;
        mappingStub = null;
    });

    describe('should initialize correctly', function() {
        it('if the serialization is turtle', function() {
            component.previewForm.controls.serialization.setValue('turtle');
            component.ngOnInit();
            expect(component.editorOptions.mode).toEqual('text/turtle');
        });
        it('if the serialization is jsonld', function() {
            component.previewForm.controls.serialization.setValue('jsonld');
            component.ngOnInit();
            expect(component.editorOptions.mode).toEqual('application/ld+json');
        });
        it('if the serialization is rdf/xml', function() {
            component.previewForm.controls.serialization.setValue('rdf/xml');
            component.ngOnInit();
            expect(component.editorOptions.mode).toEqual('application/xml');
        });
        it('if the serialization is not set', function() {
            expect(component.previewForm.controls.serialization.value).toEqual('');
            expect(component.editorOptions.mode).toEqual('');
        });
    });
    describe('controller methods', function() {
        describe('should generate an RDF preview', function() {
            it('unless an error occurs', fakeAsync(function() {
                delimitedManagerStub.previewMap.and.returnValue(throwError(error));
                component.generatePreview();
                tick();
                expect(delimitedManagerStub.previewMap).toHaveBeenCalledWith([], '');
                expect(delimitedManagerStub.preview).toEqual('');
                expect(component.errorMessage).toEqual(error);
                expect(component.previewForm.controls.preview.value).toEqual('');
            }));
            describe('successfully', function() {
                it('if format is JSON-LD', fakeAsync(function() {
                    delimitedManagerStub.previewMap.and.returnValue(of([]));
                    component.previewForm.controls.serialization.setValue('jsonld');
                    component.generatePreview();
                    tick();
                    expect(delimitedManagerStub.previewMap).toHaveBeenCalledWith([], 'jsonld');
                    expect(component.editorOptions.mode).toEqual('application/ld+json');
                    expect(delimitedManagerStub.preview).toEqual('[]');
                    expect(component.previewForm.controls.preview.value).toEqual('[]');
                }));
                it('if format is turtle', fakeAsync(function() {
                    const preview = 'urn:test a urn:Test.';
                    delimitedManagerStub.previewMap.and.returnValue(of(preview));
                    component.previewForm.controls.serialization.setValue('turtle');
                    component.generatePreview();
                    tick();
                    expect(delimitedManagerStub.previewMap).toHaveBeenCalledWith([], 'turtle');
                    expect(component.editorOptions.mode).toEqual('text/turtle');
                    expect(delimitedManagerStub.preview).toEqual(preview);
                    expect(component.previewForm.controls.preview.value).toEqual(preview);
                }));
                it('if format is RDF/XML', fakeAsync(function() {
                    const preview = 'urn:test a urn:Test.';
                    delimitedManagerStub.previewMap.and.returnValue(of(preview));
                    component.previewForm.controls.serialization.setValue('rdf/xml');
                    component.generatePreview();
                    tick();
                    expect(delimitedManagerStub.previewMap).toHaveBeenCalledWith([], 'rdf/xml');
                    expect(component.editorOptions.mode).toEqual('application/xml');
                    expect(delimitedManagerStub.preview).toEqual(preview);
                    expect(component.previewForm.controls.preview.value).toEqual(preview);
                }));
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.rdf-preview-tab')).length).toEqual(1);
            expect(element.queryAll(By.css('.row')).length).toEqual(1);
            expect(element.queryAll(By.css('.col-5')).length).toEqual(1);
            expect(element.queryAll(By.css('.col-7')).length).toEqual(1);
            expect(element.queryAll(By.css('.serialization-container')).length).toEqual(1);
            expect(element.queryAll(By.css('.codemirror-wrapper')).length).toEqual(1);
        });
        ['mapper-serialization-select', 'button[color="primary"]', 'ngx-codemirror', 'preview-data-grid'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on whether an error has occurred', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);

            component.errorMessage = error;
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
    });
    it('should call generatePreview when the Refresh button is clicked', function() {
        spyOn(component, 'generatePreview');
        const button = element.queryAll(By.css('.serialization-container button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.generatePreview).toHaveBeenCalledWith();
    });
});
