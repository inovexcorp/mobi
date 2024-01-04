/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyClassSelectComponent } from './ontologyClassSelect.component';

describe('Ontology Class Select component', function() {
    let component: OntologyClassSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OntologyClassSelectComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    const classOption = { item: 'iri', name: 'name' };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
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
                OntologyClassSelectComponent,
            ],
            providers: [
                MockProvider(OntologyStateService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(OntologyClassSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;

        ontologyStateStub.listItem = new OntologyListItem();
        spyOn(component.selectedChange, 'emit');
        ontologyStateStub.getEntityNameByListItem.and.returnValue(classOption.name);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
    });

    it('should initialize correctly', function() {
        component.selected = [classOption.item];
        component.ngOnInit();
        expect(component.selectedOptions).toEqual([classOption]);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.ontology-class-select')).length).toEqual(1);
        });
        ['mat-form-field', 'input[aria-label="Class"]', 'mat-chip-list', 'mat-autocomplete'].forEach(el => {
            it('with a ' + el, function() {
                expect(element.queryAll(By.css(el)).length).toEqual(1);
            });
        });
        it('depending on how many classes are selected', function() {
            component.selected = ['classA', 'classB'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-chip')).length).toEqual(component.selected.length);
        });
    });
    describe('controller methods', function() {
        describe('filter should call the correct method', function() {
            beforeEach(function() {
                ontologyStateStub.listItem.classes.iris = { [classOption.item]: 'ontologyId' };
                this.group = {
                    namespace: 'ontologyId',
                    options: [classOption]
                };
                ontologyStateStub.getGroupedSelectList.and.returnValue([this.group]);
            });
            it('with extra options', function() {
                component.extraOptions = ['other'];
                const result = component.filter('text');
                expect(ontologyStateStub.getGroupedSelectList).toHaveBeenCalledWith([classOption.item, 'other'], 'text', jasmine.any(Function));
                expect(result).toEqual([this.group]);
            });
            it('without extra options', function() {
                const result = component.filter('text');
                expect(ontologyStateStub.getGroupedSelectList).toHaveBeenCalledWith([classOption.item], 'text', jasmine.any(Function));
                expect(result).toEqual([this.group]);
            });
        });
        describe('add should handle adding a chip when', function() {
            it('the class exists', function() {
                ontologyStateStub.listItem.classes.iris = { [classOption.item]: 'ontologyId' };
                component.add({chipInput: null, input: null, value: classOption.item});
                expect(component.selected).toEqual([classOption.item]);
                expect(component.selectedOptions).toEqual([classOption]);
                expect(component.selectedChange.emit).toHaveBeenCalledWith([classOption.item]);
                expect(component.clazzControl.value).toEqual(null);
            });
            it('the class does not exist', function() {
                component.add({chipInput: null, input: null, value: classOption.item});
                expect(component.selected).toEqual([]);
                expect(component.selectedOptions).toEqual([]);
                expect(component.selectedChange.emit).not.toHaveBeenCalled();
                expect(component.clazzControl.value).toEqual(null);
            });
        });
        it('remove should handle removing a class', function() {
            component.remove(classOption);
            expect(component.selected).toEqual([]);
            expect(component.selectedChange.emit).not.toHaveBeenCalled();

            component.selected = [classOption.item];
            component.remove(classOption);
            expect(component.selected).toEqual([]);
            expect(component.selectedChange.emit).toHaveBeenCalledWith([]);
        });
        it('select should handle selecting an option in the autocomplete', function() {
            const event: MatAutocompleteSelectedEvent = {
                option: {
                    value: classOption
                }
            } as MatAutocompleteSelectedEvent;
            component.select(event);
            expect(component.selected).toEqual([classOption.item]);
            expect(component.selectedOptions).toEqual([classOption]);
            expect(component.selectedChange.emit).toHaveBeenCalledWith([classOption.item]);
            expect(component.clazzInput.nativeElement.value).toEqual('');
            expect(component.clazzControl.value).toEqual(null);
        });
    });
});
