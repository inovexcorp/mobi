/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { MatButtonModule, MatDialogModule, MatDialogRef } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';

import { cleanStylesFromDOM, mockCatalogManager } from '../../../../../../test/ts/Shared';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { MatIconModule } from '@angular/material/icon';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CreateTagModal } from './createTagModal.component';

describe('Create tag component', function() {
    let component: CreateTagModal;
    let element: DebugElement;
    let fixture: ComponentFixture<CreateTagModal>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateTagModal>>;
    let shapesGraphStateStub;
    let catalogManagerStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatSelectModule,
                MatDialogModule,
                MatButtonModule,
                NoopAnimationsModule,
                MatChipsModule,
                MatIconModule
            ],
            declarations: [
                CreateTagModal,
                MockComponent(ErrorDisplayComponent),
                MockPipe(SplitIRIPipe),
                MockPipe(CamelCasePipe)
            ],
            providers: [
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                { provide: 'catalogManagerService', useClass: mockCatalogManager },
                MockProvider(ShapesGraphStateService),
                SplitIRIPipe,
                CamelCasePipe
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CreateTagModal);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        shapesGraphStateStub.listItem.shapesGraphId = 'shapesGraphId';
        shapesGraphStateStub.listItem.versionedRdfRecord.recordId = 'recordId';
        shapesGraphStateStub.listItem.versionedRdfRecord.commitId = 'commitId';
        shapesGraphStateStub.changeShapesGraphVersion.and.returnValue(Promise.resolve());

        catalogManagerStub = TestBed.get('catalogManagerService');
        catalogManagerStub.localCatalog = {'@id': 'catalog'};
        catalogManagerStub.createRecordTag.and.returnValue(Promise.resolve('urn:tag'));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        shapesGraphStateStub = null;
        catalogManagerStub = null;
    });

    describe('controller methods', function() {
        beforeEach(function() {
            component.createTagForm.controls['title'].setValue('New Tag');
            component.createTagForm.controls['description'].setValue('New Tag Description');
            component.createTagForm.controls['iri'].setValue('urn:tag');
            this.tagConfig = {
                title: 'New Tag',
                iri: 'urn:tag',
                description: 'New Tag Description',
                commitId: 'commitId'
            };
        });
        it('should init with the correct IRI prefix', function() {
            component.ngOnInit();

            expect(component.createTagForm.controls.iri.value).toEqual('shapesGraphId/');
        });
        describe('nameChanged should update the IRI', function() {
            it('when the IRI has not been edited directly', function() {
                expect(component.createTagForm.controls.iri.value).toEqual('urn:tag');
                spyOn(component['splitIRI'], 'transform').and.returnValue({
                    begin: 'begin',
                    then: 'then',
                    end: 'end'
                });
                spyOn(component['camelCase'], 'transform').and.returnValue('camelCase');
                component.nameChanged();

                expect(component['splitIRI'].transform).toHaveBeenCalledWith('urn:tag');
                expect(component['camelCase'].transform).toHaveBeenCalledWith('New Tag', 'class');
                expect(component.createTagForm.controls.iri.value).toEqual('beginthencamelCase');
            });
            it('unless the IRI has not been edited directly', function() {
                expect(component.createTagForm.controls.iri.value).toEqual('urn:tag');
                spyOn(component['splitIRI'], 'transform');
                spyOn(component['camelCase'], 'transform');
                component.iriHasChanged = true;
                component.nameChanged();

                expect(component['splitIRI'].transform).not.toHaveBeenCalled();
                expect(component['camelCase'].transform).not.toHaveBeenCalled();
                expect(component.createTagForm.controls.iri.value).toEqual('urn:tag');
            });
        });
        describe('should create a tag on a shapes graph record',  function() {
            describe('and change the shapes graph version', function() {
                it('successfully', async function() {
                    await component.createTag();

                    expect(catalogManagerStub.createRecordTag).toHaveBeenCalledWith('recordId', 'catalog', this.tagConfig);
                    expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('recordId', undefined, 'commitId', 'urn:tag', this.tagConfig.title, true);
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                    expect(component.error).toEqual('');
                });

                it('unless an error occurs', async function() {
                    shapesGraphStateStub.changeShapesGraphVersion.and.returnValue(Promise.reject('Error'));
                    await component.createTag();

                    expect(catalogManagerStub.createRecordTag).toHaveBeenCalledWith('recordId', 'catalog', this.tagConfig);
                    expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('recordId', undefined, 'commitId', 'urn:tag', this.tagConfig.title, true);
                    expect(component.error).toEqual('Error');
                });
            });
            it('unless an error occurs', async function() {
                catalogManagerStub.createRecordTag.and.returnValue(Promise.reject('Error'));
                await component.createTag();

                expect(catalogManagerStub.createRecordTag).toHaveBeenCalledWith('recordId', 'catalog', this.tagConfig);
                expect(shapesGraphStateStub.changeShapesGraphVersion).not.toHaveBeenCalled();
                expect(component.error).toEqual('Error');
            });
        });
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('.create-tag-modal')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('input')).length).toEqual(2);
            expect(element.queryAll(By.css('textarea')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('button'));

            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });

    it('should call createTag when the submit button is clicked', function() {
        spyOn(component, 'createTag');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();

        expect(component.createTag).toHaveBeenCalled();
    });
});
