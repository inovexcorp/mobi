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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Mapping } from '../../../shared/models/mapping.class';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ClassMappingDetailsComponent } from '../classMappingDetails/classMappingDetails.component';
import { ClassMappingOverlayComponent } from '../classMappingOverlay/classMappingOverlay.component';
import { ClassMappingSelectComponent } from '../classMappingSelect/classMappingSelect.component';
import { MappingConfigOverlayComponent } from '../mappingConfigOverlay/mappingConfigOverlay.component';
import { PreviewDataGridComponent } from '../previewDataGrid/previewDataGrid.component';
import { RunMappingDatasetOverlayComponent } from '../runMappingDatasetOverlay/runMappingDatasetOverlay.component';
import { RunMappingDownloadOverlayComponent } from '../runMappingDownloadOverlay/runMappingDownloadOverlay.component';
import { RunMappingOntologyOverlayComponent } from '../runMappingOntologyOverlay/runMappingOntologyOverlay.component';
import { DCTERMS } from '../../../prefixes';
import { EditMappingTabComponent } from './editMappingTab.component';

describe('Edit Mapping Tab component', function() {
    let component: EditMappingTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditMappingTabComponent>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;
    let matDialog: jasmine.SpyObj<MatDialog>;

    const error = 'Error Message';
    const classMapping: JSONLDObject = {
        '@id': 'classMappingId'
    };
    let mappingStub: jasmine.SpyObj<Mapping>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                MatButtonModule,
                MatMenuModule,
                MatIconModule,
                MatButtonToggleModule
             ],
            declarations: [
                EditMappingTabComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(ClassMappingDetailsComponent),
                MockComponent(ClassMappingSelectComponent),
                MockComponent(PreviewDataGridComponent),
                MockComponent(ClassMappingOverlayComponent),
                MockComponent(MappingConfigOverlayComponent),
                MockComponent(RunMappingDownloadOverlayComponent),
                MockComponent(RunMappingDatasetOverlayComponent),
                MockComponent(RunMappingOntologyOverlayComponent),
                MockComponent(ConfirmModalComponent),
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(DelimitedManagerService),
                MockProvider(ToastService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(classMapping)}
                }) }
            ]
        }).compileComponents();

        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>; // Done first to avoid reading properties of undefined
        mappingStub = jasmine.createSpyObj('Mapping', [
            'getAllClassMappings'
        ]);
        mappingStub.getAllClassMappings.and.returnValue([]);
        mapperStateStub.selected = {
            mapping: mappingStub,
            difference: new Difference(),
            config: {
                title: '',
            }
        };
        mapperStateStub.selectMappingStep = 0;
        mapperStateStub.editMappingStep = 2;
        mapperStateStub.step = mapperStateStub.editMappingStep;
        mapperStateStub.invalidProps = [];

        fixture = TestBed.createComponent(EditMappingTabComponent);
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

    describe('should initialize correctly', function() {
        beforeEach(function() {
            spyOn(component, 'setOntologyTitle');
            spyOn(component, 'setClassMappings');
            spyOn(component, 'openMappingConfig');
        });
        it('if it should be started with the config modal', function() {
            mapperStateStub.startWithConfigModal = true;
            component.ngOnInit();
            expect(component.setOntologyTitle).toHaveBeenCalledWith();
            expect(component.setClassMappings).toHaveBeenCalledWith();
            expect(component.openMappingConfig).toHaveBeenCalledWith();
        });
        it('if it should not be started with the config modal', function() {
            component.ngOnInit();
            expect(component.setOntologyTitle).toHaveBeenCalledWith();
            expect(component.setClassMappings).toHaveBeenCalledWith();
            expect(component.openMappingConfig).not.toHaveBeenCalled();
        });
    });
    it('should handle being destroyed', function() {
        component.ngOnDestroy();
        expect(mapperStateStub.selectedPropMappingId).toEqual('');
        expect(mapperStateStub.highlightIndexes).toEqual([]);
    });
    describe('controller methods', function() {
        it('should open the classMappingOverlay', fakeAsync(function() {
            spyOn(component, 'setClassMappings');
            component.openClassMappingOverlay();
            tick();
            expect(matDialog.open).toHaveBeenCalledWith(ClassMappingOverlayComponent);
            expect(component.setClassMappings).toHaveBeenCalledWith();
            expect(mapperStateStub.selectedClassMappingId).toEqual(classMapping['@id']);
        }));
        it('should open the mappingConfigOverlay', fakeAsync(function() {
            spyOn(component, 'setOntologyTitle');
            spyOn(component, 'setClassMappings');
            component.openMappingConfig();
            tick();
            expect(matDialog.open).toHaveBeenCalledWith(MappingConfigOverlayComponent);
            expect(component.setOntologyTitle).toHaveBeenCalledWith();
            expect(component.setClassMappings).toHaveBeenCalledWith();
            expect(mapperStateStub.startWithConfigModal).toBeFalse();
        }));
        describe('should delete a class mapping from the mapping', function() {
            beforeEach(function() {
                spyOn(component, 'setClassMappings');
            });
            it('if the Class Mapping is the selected one', function() {
                mapperStateStub.selectedClassMappingId = classMapping['@id'];
                component.deleteClass(classMapping);
                expect(mapperStateStub.deleteClass).toHaveBeenCalledWith(classMapping['@id']);
                expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                expect(mapperStateStub.selectedClassMappingId).toEqual('');
                expect(component.setClassMappings).toHaveBeenCalledWith();
            });
            it('if a different class mapping is selected', function() {
                mapperStateStub.selectedClassMappingId = 'other';
                component.deleteClass(classMapping);
                expect(mapperStateStub.deleteClass).toHaveBeenCalledWith(classMapping['@id']);
                expect(mapperStateStub.resetEdit).not.toHaveBeenCalled();
                expect(mapperStateStub.selectedClassMappingId).toEqual('other');
                expect(component.setClassMappings).toHaveBeenCalledWith();
            });
        });
        it('should set the title of the selected ontology', function() {
            mapperStateStub.selected.ontology = {
                '@id': 'ontology',
                [`${DCTERMS}title`]: [{ '@value': 'title' }]
            };
            component.setOntologyTitle();
            expect(component.ontologyTitle).toEqual('title');
        });
        it('should set the class mappings of the mapping', function() {
            mappingStub.getAllClassMappings.and.returnValue([classMapping]);
            component.setClassMappings();
            expect(mappingStub.getAllClassMappings).toHaveBeenCalledWith();
            expect(component.classMappings).toEqual([classMapping]);
        });
        it('should open the runMappingDownloadOverlay', function() {
            component.openRunMappingDownload();
            expect(matDialog.open).toHaveBeenCalledWith(RunMappingDownloadOverlayComponent);
        });
        it('should open the runMappingDatasetOverlay', function() {
            component.openRunMappingDataset();
            expect(matDialog.open).toHaveBeenCalledWith(RunMappingDatasetOverlayComponent);
        });
        it('should open the runMappingOntologyOverlay', function() {
            component.openRunMappingOntology();
            expect(matDialog.open).toHaveBeenCalledWith(RunMappingOntologyOverlayComponent);
        });
        it('should test whether the mapping is saveable', function() {
            expect(component.isSaveable()).toBeFalse();
            component.classMappings = [classMapping];
            expect(component.isSaveable()).toBeTrue();
            mapperStateStub.invalidProps = [{
                id: '',
                index: 0
            }];
            expect(component.isSaveable()).toBeFalse();
        });
        describe('should save the mapping', function() {
            it('if the mapping has not changed', function() {
                mapperStateStub.isMappingChanged.and.returnValue(false);
                component.save();
                expect(mapperStateStub.saveMapping).not.toHaveBeenCalled();
                expect(component.errorMessage).toEqual('');
                expect(mapperStateStub.step).toEqual(mapperStateStub.selectMappingStep);
                expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
            });
            describe('if the mapping has changed', function() {
                beforeEach(function() {
                    mapperStateStub.isMappingChanged.and.returnValue(true);
                });
                it('unless an error occurs', fakeAsync(function() {
                    mapperStateStub.saveMapping.and.returnValue(throwError(error));
                    component.save();
                    tick();
                    expect(mapperStateStub.saveMapping).toHaveBeenCalledWith();
                    expect(component.errorMessage).toEqual(error);
                    expect(mapperStateStub.step).toEqual(mapperStateStub.editMappingStep);
                    expect(mapperStateStub.initialize).not.toHaveBeenCalled();
                    expect(mapperStateStub.resetEdit).not.toHaveBeenCalled();
                    expect(delimitedManagerStub.reset).not.toHaveBeenCalled();
                }));
                it('successfully', fakeAsync(function() {
                    mapperStateStub.saveMapping.and.returnValue(of(null));
                    component.save();
                    tick();
                    expect(mapperStateStub.saveMapping).toHaveBeenCalledWith();
                    expect(component.errorMessage).toEqual('');
                    expect(mapperStateStub.step).toEqual(mapperStateStub.selectMappingStep);
                    expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                    expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                    expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
                }));
            });
        });
        describe('should handle canceling the edit', function() {
            it('if the mapping has not changed', function() {
                mapperStateStub.isMappingChanged.and.returnValue(false);
                component.cancel();
                expect(matDialog.open).not.toHaveBeenCalled();
                expect(mapperStateStub.step).toEqual(mapperStateStub.selectMappingStep);
                expect(component.errorMessage).toEqual('');
                expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
            });
            it('if the mapping has changed', fakeAsync(function() {
                mapperStateStub.isMappingChanged.and.returnValue(true);
                component.cancel();
                tick();
                expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {
                    data: { content: jasmine.stringContaining('Are you sure') }
                });
                expect(mapperStateStub.step).toEqual(mapperStateStub.selectMappingStep);
                expect(component.errorMessage).toEqual('');
                expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
            }));
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            spyOn(component, 'setClassMappings');
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.edit-mapping-tab')).length).toEqual(1);
            expect(element.queryAll(By.css('.mapping-config')).length).toEqual(1);
            expect(element.queryAll(By.css('.class-mappings')).length).toEqual(1);
            expect(element.queryAll(By.css('.button-container')).length).toEqual(1);
        });
        [
            'class-mapping-select',
            'class-mapping-details',
            'preview-data-grid',
            '.mapping-title',
            '.mapping-config button',
            '.class-mappings button.add-class-mapping-button',
            '.button-container button.cancel-mapping',
            '.button-container mat-button-toggle-group'
        ].forEach(test => {
            it(`with a ${test}`, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on whether there is an error', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.errorMessage = 'Error message';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('depending on whether an ontology is selected', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('.add-class-mapping-button'))[0];
            expect(button).toBeTruthy();
            expect(button.properties['disabled']).toBeTruthy();

            mapperStateStub.selected.ontology = { '@id': 'ont' };
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on whether the mapping is saveable', function() {
            spyOn(component, 'isSaveable').and.returnValue(false);
            fixture.detectChanges();
            const buttons = element.queryAll(By.css('.button-container mat-button-toggle-group mat-button-toggle'));
            expect(buttons.length).toBeGreaterThan(0);
            buttons.forEach(button => {
                expect(button.classes['mat-button-toggle-disabled']).toBeTruthy();
            });
        });
    });
    it('should call openClassMappingOverlay when the add class button is linked', function() {
        spyOn(component, 'openClassMappingOverlay');
        const button = element.queryAll(By.css('.class-mappings button.add-class-mapping-button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.openClassMappingOverlay).toHaveBeenCalledWith();
    });
    it('should call openMappingConfig when the edit config link is clicked', function() {
        spyOn(component, 'openMappingConfig');
        const button = element.queryAll(By.css('.mapping-config button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.openMappingConfig).toHaveBeenCalledWith();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(component, 'cancel');
        const button = element.queryAll(By.css('.cancel-mapping'))[0];
        button.triggerEventHandler('click', null);
        expect(component.cancel).toHaveBeenCalledWith();
    });
    it('should call save when the button is clicked', function() {
        spyOn(component, 'save');
        const button = element.queryAll(By.css('.save-button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.save).toHaveBeenCalledWith();
    });
    describe('menu button', function() {
        beforeEach(function() {
            fixture.detectChanges();
            const menuButton = element.queryAll(By.css('.drop-down-button'))[0];
            menuButton.triggerEventHandler('click', null);
        });
        it('should call openRunMappingDownload', function() {
            spyOn(component, 'openRunMappingDownload');
            const button = element.queryAll(By.css('.mat-menu-panel button.run-download'))[0];
            button.triggerEventHandler('click', null);
            expect(component.openRunMappingDownload).toHaveBeenCalledWith();
        });
        it('should call openRunMappingDataset', function() {
            spyOn(component, 'openRunMappingDataset');
            const button = element.queryAll(By.css('.mat-menu-panel button.run-dataset'))[0];
            button.triggerEventHandler('click', null);
            expect(component.openRunMappingDataset).toHaveBeenCalledWith();
        });
        it('should call openRunMappingOntology', function() {
            spyOn(component, 'openRunMappingOntology');
            const button = element.queryAll(By.css('.mat-menu-panel button.run-ontology'))[0];
            button.triggerEventHandler('click', null);
            expect(component.openRunMappingOntology).toHaveBeenCalledWith();
        });
    });
});
