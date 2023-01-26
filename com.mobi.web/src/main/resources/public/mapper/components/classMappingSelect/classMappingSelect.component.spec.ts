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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatButtonModule, MatDialog, MatFormFieldModule, MatIconModule, MatInputModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../../test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { UtilService } from '../../../shared/services/util.service';
import { ClassMappingSelectComponent } from './classMappingSelect.component';

describe('Class Mapping Select component', function() {
    let component: ClassMappingSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ClassMappingSelectComponent>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let matDialog: jasmine.SpyObj<MatDialog>;

    const classMapping: JSONLDObject = { '@id': 'classMapping' };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatAutocompleteModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                ClassMappingSelectComponent,
                MockComponent(ConfirmModalComponent)
            ],
            providers: [
                MockProvider(UtilService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                }) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ClassMappingSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        utilStub = TestBed.get(UtilService);
        matDialog = TestBed.get(MatDialog);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        utilStub = null;
        matDialog = null;
    });

    it('should handle updates to classMappingId', function() {
        expect(component.classMappingControl.value).toEqual('');
        component.classMappings = [classMapping];
        component.classMappingId = classMapping['@id'];
        expect(component.classMappingControl.value).toEqual(classMapping);
        component.classMappingId = 'error';
        expect(component.classMappingControl.value).toBeUndefined();
    });
    describe('controller methods', function() {
        it('should get the title of a class mapping', function() {
            utilStub.getDctermsValue.and.returnValue('Title');
            expect(component.getTitle(classMapping)).toEqual('Title');
            expect(utilStub.getDctermsValue).toHaveBeenCalledWith(classMapping, 'title');
        });
        it('should select a Class Mapping', function() {
            component.classMappings = [];
            spyOn(component.classMappingIdChange, 'emit');
            const event: MatAutocompleteSelectedEvent = {
                option: {
                    value: classMapping
                }
            } as MatAutocompleteSelectedEvent;
            component.selectClassMapping(event);
            expect(component.classMappingId).toEqual(classMapping['@id']);
            expect(component.classMappingIdChange.emit).toHaveBeenCalledWith(classMapping['@id']);
        });
        it('should confirm the deletion of a class mapping', fakeAsync(function() {
            spyOn(component.deleteClassMapping, 'emit');
            component.confirmDelete(classMapping);
            tick();
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {
                data: {
                    content: jasmine.stringContaining('Are you sure you want to delete')
                }
            });
            expect(component.deleteClassMapping.emit).toHaveBeenCalledWith(classMapping);
        }));
        describe('should correctly filter the class mapping list based on the input', function() {
            beforeEach(function() {
                spyOn(component, 'getTitle').and.callFake(obj => obj['@id']);
            });
            it('if there are no class mappings', function() {
                expect(component.filter('')).toEqual([]);
            });
            describe('if there are class mappings', function() {
                beforeEach(function() {
                    component.classMappings = [classMapping, {'@id': 'A'}, {'@id': 'B'}];
                });
                it('and no value', function() {
                    expect(component.filter('')).toEqual([{'@id': 'A'}, {'@id': 'B'}, classMapping]);
                });
                it('and a text value with one result', function() {
                    expect(component.filter(classMapping['@id'])).toEqual([classMapping]);
                });
                it('and a text value with multiple results', function() {
                    expect(component.filter('a')).toEqual([{'@id': 'A'}, classMapping]);
                });
                it('and an object value', function() {
                    expect(component.filter(classMapping)).toEqual([classMapping]);
                });
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.class-mapping-select')).length).toEqual(1);
        });
        ['mat-form-field', 'input[aria-label="Class Mapping"]', 'mat-autocomplete'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
    });
});
