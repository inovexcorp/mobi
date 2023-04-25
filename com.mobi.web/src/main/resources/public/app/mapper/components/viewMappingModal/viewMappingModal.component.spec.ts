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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MappingState } from '../../../shared/models/mappingState.interface';
import { UtilService } from '../../../shared/services/util.service';
import { MappingPreviewComponent } from '../mappingPreview/mappingPreview.component';
import { ViewMappingModalComponent } from './viewMappingModal.component';

describe('View Mapping Modal component', function() {
    let component: ViewMappingModalComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ViewMappingModalComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<ViewMappingModalComponent>>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const ontology: JSONLDObject = { '@id': 'ontology' };
    const state: MappingState = {
        mapping: undefined,
        difference: new Difference(),
        ontology,
        record: {
            id: '',
            title: '',
            description: '',
            modified: '',
            keywords: [],
            branch: ''
        }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatDialogModule,
                MatButtonModule,
            ],
            declarations: [
                ViewMappingModalComponent,
                MockComponent(MappingPreviewComponent),
            ],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: { state } },
                MockProvider(UtilService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ViewMappingModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ViewMappingModalComponent>>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        utilStub = null;
    });

    it('should initialize properly', function() {
        utilStub.getDctermsValue.and.returnValue('title');
        component.ngOnInit();
        expect(component.ontologyTitle).toEqual('title');
        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(ontology, 'title');
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['.source-ontology', 'mapping-preview', '.mat-dialog-actions button'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
});
