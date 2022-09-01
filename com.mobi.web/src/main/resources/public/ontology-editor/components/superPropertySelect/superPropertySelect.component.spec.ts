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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule, MatFormFieldModule, MatAutocompleteModule, MatIconModule, MatChipsModule, MatAutocompleteSelectedEvent } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { SuperPropertySelectComponent } from './superPropertySelect.component';

describe('Super Property Select component', function() {
    let component: SuperPropertySelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SuperPropertySelectComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    const propOption = { item: 'iri', name: 'name' };
    const idObj: JSONLDId = {'@id': propOption.item};

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatAutocompleteModule,
                MatIconModule,
                MatChipsModule
            ],
            declarations: [
                SuperPropertySelectComponent,
            ],
            providers: [
                MockProvider(OntologyStateService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(SuperPropertySelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);

        ontologyStateStub.listItem = new OntologyListItem();
        spyOn(component.selectedChange, 'emit');
        ontologyStateStub.getEntityNameByListItem.and.returnValue(propOption.name);
        component.key = 'dataProperties';
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
    });

    it('should initialize correctly', function() {
        component.selected = [idObj];
        component.ngOnInit();
        expect(component.selectedOptions).toEqual([propOption]);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.super-property-select')).length).toEqual(1);
        });
        it('for correct links', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.btn-show .fa-plus')).length).toEqual(1);
            expect(element.queryAll(By.css('.btn-hide .fa-times')).length).toEqual(0);

            component.isShown = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.btn-show .fa-plus')).length).toEqual(0);
            expect(element.queryAll(By.css('.btn-hide .fa-times')).length).toEqual(1);
        });
        ['mat-form-field', 'input[aria-label="Property"]', 'mat-chip-list', 'mat-autocomplete'].forEach(el => {
            it('with a ' + el, function() {
                component.isShown = true;
                fixture.detectChanges();
                expect(element.queryAll(By.css(el)).length).toEqual(1);
            });
        });
        it('depending on how many properties are selected', function() {
            component.isShown = true;
            component.selected = [{'@id': 'propA'}, {'@id': 'propB'}];
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-chip')).length).toEqual(component.selected.length);
        });
    });
    describe('controller methods', function() {
        it('show sets the proper variables', function() {
            component.show();
            expect(component.isShown).toEqual(true);
        });
        it('hide sets the proper variables', function() {
            component.hide();
            expect(component.isShown).toEqual(false);
            expect(component.selected).toEqual([]);
            expect(component.selectedOptions).toEqual([]);
            expect(component.selectedChange.emit).toHaveBeenCalledWith([]);
        });
        it('filter should call the correct method', function() {
            ontologyStateStub.listItem[component.key].iris = { [propOption.item]: 'ontologyId' };
            const group = {
                namespace: 'ontologyId',
                options: [propOption]
            };
            ontologyStateStub.getGroupedSelectList.and.returnValue([group]);
            const result = component.filter('text');
            expect(ontologyStateStub.getGroupedSelectList).toHaveBeenCalledWith([propOption.item], 'text', jasmine.any(Function));
            expect(result).toEqual([group]);
        });
        it('add should handle adding a chip', function() {
            component.add({input: null, value: propOption.item});
            expect(component.selected).toEqual([idObj]);
            expect(component.selectedOptions).toEqual([propOption]);
            expect(component.selectedChange.emit).toHaveBeenCalledWith([idObj]);
            expect(component.propControl.value).toEqual(null);
        });
        it('remove should handle removing a class', function() {
            component.remove(propOption);
            expect(component.selected).toEqual([]);
            expect(component.selectedChange.emit).not.toHaveBeenCalled();

            component.selected = [idObj];
            component.remove(propOption);
            expect(component.selected).toEqual([]);
            expect(component.selectedChange.emit).toHaveBeenCalledWith([]);
        });
        it('select should handle selecting an option in the autocomplete', function() {
            component.isShown = true;
            fixture.detectChanges();
            const event: MatAutocompleteSelectedEvent = {
                option: {
                    value: propOption
                }
            } as MatAutocompleteSelectedEvent;
            component.select(event);
            expect(component.selected).toEqual([idObj]);
            expect(component.selectedOptions).toEqual([propOption]);
            expect(component.selectedChange.emit).toHaveBeenCalledWith([idObj]);
            expect(component.propInput.nativeElement.value).toEqual('');
            expect(component.propControl.value).toEqual(null);
        });
    });
});
