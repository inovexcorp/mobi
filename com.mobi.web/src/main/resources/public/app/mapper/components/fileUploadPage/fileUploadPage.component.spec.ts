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
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { DELIM } from '../../../prefixes';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Mapping } from '../../../shared/models/mapping.class';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { SharedModule } from '../../../shared/shared.module';
import { FileUploadFormComponent } from '../fileUploadForm/fileUploadForm.component';
import { MappingPreviewComponent } from '../mappingPreview/mappingPreview.component';
import { PreviewDataGridComponent } from '../previewDataGrid/previewDataGrid.component';
import { RunMappingDatasetOverlayComponent } from '../runMappingDatasetOverlay/runMappingDatasetOverlay.component';
import { RunMappingDownloadOverlayComponent } from '../runMappingDownloadOverlay/runMappingDownloadOverlay.component';
import { RunMappingOntologyOverlayComponent } from '../runMappingOntologyOverlay/runMappingOntologyOverlay.component';
import { FileUploadPageComponent } from './fileUploadPage.component';

describe('File Upload Page component', function() {
    let component: FileUploadPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<FileUploadPageComponent>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;
    let matDialog: jasmine.SpyObj<MatDialog>;

    const classId1 = 'classId1';
    const classId2 = 'classId2';
    const classMapping1: JSONLDObject = {
        '@id': 'classMapping1',
        [`${DELIM}mapsTo`]: [{'@id': classId1}]
    };
    const classMapping2: JSONLDObject = {
        '@id': 'classMapping2',
        [`${DELIM}mapsTo`]: [{'@id': classId1}]
    };
    const classMapping3: JSONLDObject = {
        '@id': 'classMapping3',
        [`${DELIM}mapsTo`]: [{'@id': classId2}]
    };
    let mappingStub: jasmine.SpyObj<Mapping>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                SharedModule
             ],
            declarations: [
                FileUploadPageComponent,
                MockComponent(MappingPreviewComponent),
                MockComponent(FileUploadFormComponent),
                MockComponent(PreviewDataGridComponent),
                MockComponent(RunMappingDownloadOverlayComponent),
                MockComponent(RunMappingDatasetOverlayComponent),
                MockComponent(RunMappingOntologyOverlayComponent),
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(DelimitedManagerService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                }) }
            ]
        });
    });

    beforeEach(function() {
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>; // Done first to avoid reading properties of undefined
        mappingStub = jasmine.createSpyObj('Mapping', [
            'getAllClassMappings'
        ]);
        mappingStub.getAllClassMappings.and.returnValue([classMapping1, classMapping2, classMapping3]);
        mapperStateStub.selected = {
            mapping: mappingStub,
            difference: new Difference(),
            config: {
                title: '',
            }
        };
        mapperStateStub.fileUploadStep = 1;
        mapperStateStub.editMappingStep = 2;
        mapperStateStub.step = mapperStateStub.fileUploadStep;
        mapperStateStub.invalidProps = [];

        fixture = TestBed.createComponent(FileUploadPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        delimitedManagerStub = TestBed.inject(DelimitedManagerService) as jasmine.SpyObj<DelimitedManagerService>;
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mapperStateStub = null;
        delimitedManagerStub = null;
        matDialog = null;
        mappingStub = null;
    });

    describe('controller methods', function() {
        it('should open the runMappingDownloadOverlay', function() {
            component.runMappingDownload();
            expect(matDialog.open).toHaveBeenCalledWith(RunMappingDownloadOverlayComponent);
        });
        it('should open the runMappingDatasetOverlay', function() {
            component.runMappingDataset();
            expect(matDialog.open).toHaveBeenCalledWith(RunMappingDatasetOverlayComponent);
        });
        it('should open the runMappingOntologyOverlay', function() {
            component.runMappingOntology();
            expect(matDialog.open).toHaveBeenCalledWith(RunMappingOntologyOverlayComponent);
        });
        describe('should set the correct state for continuing to edit a mapping', function() {
            beforeEach(function() {
                mapperStateStub.startWithConfigModal = false;
            });
            it('if a new mapping is being created', function() {
                mapperStateStub.newMapping = true;
                component.edit();
                expect(mappingStub.getAllClassMappings).toHaveBeenCalledWith();
                expect(mapperStateStub.selectedClassMappingId).toEqual(classMapping1['@id']);
                expect(mapperStateStub.step).toEqual(mapperStateStub.editMappingStep);
                expect(mapperStateStub.startWithConfigModal).toBeTrue();
            });
            it('if a saved mapping is being edited', function() {
                mapperStateStub.newMapping = false;
                component.edit();
                expect(mappingStub.getAllClassMappings).toHaveBeenCalledWith();
                expect(mapperStateStub.selectedClassMappingId).toEqual(classMapping1['@id']);
                expect(mapperStateStub.step).toEqual(mapperStateStub.editMappingStep);
                expect(mapperStateStub.startWithConfigModal).toBeFalse();
            });
        });
        it('should set the correct state for canceling', function() {
            component.cancel();
            expect(mapperStateStub.initialize).toHaveBeenCalledWith();
            expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
            expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.file-upload-page')).length).toEqual(1);
            expect(element.queryAll(By.css('.row')).length).toEqual(1);
            expect(element.queryAll(By.css('.col-5')).length).toEqual(1);
            expect(element.queryAll(By.css('.col-7')).length).toEqual(1);
            expect(element.queryAll(By.css('.button-footer')).length).toEqual(1);
        });
        ['file-upload-form', 'preview-data-grid', '.button-footer button:not([color="primary"])'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on whether a file has been selected and there are invalid properties', function() {
            fixture.detectChanges();
            const continueButton = element.queryAll(By.css('.button-footer button[color="primary"]'))[0];
            expect(continueButton.properties['disabled']).toBeTruthy();

            delimitedManagerStub.dataRows = [];
            fixture.detectChanges();
            expect(continueButton.properties['disabled']).toBeFalsy();

            mapperStateStub.invalidProps = [{id: '', index: 0}];
            fixture.detectChanges();
            expect(continueButton.properties['disabled']).toBeTruthy();
        });
        it('depending on whether a mapping is being edited', function() {
            mapperStateStub.editMapping = false;
            fixture.detectChanges();
            expect(element.queryAll(By.css('mapping-preview')).length).toEqual(1);
            expect(element.queryAll(By.css('.run-btn')).length).toEqual(1);
            expect(element.queryAll(By.css('.continue-btn')).length).toEqual(0);

            mapperStateStub.editMapping = true;
            component.ngOnInit();
            fixture.detectChanges();
            expect(element.queryAll(By.css('mapping-preview')).length).toEqual(0);
            expect(element.queryAll(By.css('.run-btn')).length).toEqual(0);
            expect(element.queryAll(By.css('.continue-btn')).length).toEqual(1);
        });
        it('depending on whether there are invalid columns', function() {
            mapperStateStub.editMapping = true;
            mapperStateStub.invalidProps = [];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.invalid-props')).length).toEqual(0);

            mapperStateStub.invalidProps = [{id: 'prop', index: 0}];
            fixture.detectChanges();
            const invalidProps = element.queryAll(By.css('.invalid-props'))[0];
            expect(invalidProps).toBeTruthy();
            expect(invalidProps.queryAll(By.css('ul li')).length).toEqual(mapperStateStub.invalidProps.length);
        });
    });
    it('should call cancel when the cancel button is clicked', function() {
        spyOn(component, 'cancel');
        const button = element.queryAll(By.css('.button-footer button:not([color="primary"])'))[0];
        button.triggerEventHandler('click', null);
        expect(component.cancel).toHaveBeenCalledWith();
    });
    it('should call edit when clicking the continue button ', function() {
        mapperStateStub.editMapping = true;
        spyOn(component, 'edit');
        fixture.detectChanges();
        const button = element.queryAll(By.css('.continue-btn'))[0];
        button.triggerEventHandler('click', null);
        expect(component.edit).toHaveBeenCalledWith();
    });
    describe('menu button', function() {
        beforeEach(function() {
            fixture.detectChanges();
            const menuButton = element.queryAll(By.css('.run-btn'))[0];
            menuButton.triggerEventHandler('click', null);
        });
        it('should call openRunMappingDownload', function() {
            spyOn(component, 'runMappingDownload');
            const button = element.queryAll(By.css('.mat-menu-panel button.run-download'))[0];
            button.triggerEventHandler('click', null);
            expect(component.runMappingDownload).toHaveBeenCalledWith();
        });
        it('should call openRunMappingDataset', function() {
            spyOn(component, 'runMappingDataset');
            const button = element.queryAll(By.css('.mat-menu-panel button.run-dataset'))[0];
            button.triggerEventHandler('click', null);
            expect(component.runMappingDataset).toHaveBeenCalledWith();
        });
        it('should call openRunMappingOntology', function() {
            spyOn(component, 'runMappingOntology');
            const button = element.queryAll(By.css('.mat-menu-panel button.run-ontology'))[0];
            button.triggerEventHandler('click', null);
            expect(component.runMappingOntology).toHaveBeenCalledWith();
        });
    });
});
