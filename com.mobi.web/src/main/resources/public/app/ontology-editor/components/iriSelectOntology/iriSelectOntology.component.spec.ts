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
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { UtilService } from '../../../shared/services/util.service';
import { IriSelectOntologyComponent } from './iriSelectOntology.component';

describe('IRI Select Ontology component', function() {
    let component: IriSelectOntologyComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<IriSelectOntologyComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const iri = 'http://test.com';
    const iriOption = {
        item: iri,
        name: 'name',
        isBlankNode: false
    };

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
                IriSelectOntologyComponent,
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                MockProvider(UtilService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(IriSelectOntologyComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;

        spyOn(component.selectedChange, 'emit');
        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.ontologyId = 'ontologyId';
        component.selectList = {
            'iri1': 'A',
            'iri3': 'B',
            'iri2': 'B',
            'test1': 'A',
            'test3': 'C'
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        utilStub = null;
    });

    describe('should initialize correctly', function() {
        beforeEach(function() {
            this.group = { namespace: 'namespace', options: [iriOption] };
            spyOn(component, 'filter').and.returnValue([this.group]);
            utilStub.isBlankNodeId.and.returnValue(false);
            spyOn(component, 'getName').and.returnValue('Name');
            component.selected = ['test'];
        });
        it('when singleSelect is true', fakeAsync(function() {
            component.singleSelect = true;
            component.ngOnInit();
            component.filteredIris.subscribe(result => {
                expect(result).toEqual([this.group]);
            });
            tick();
            expect(component.singleControl.value).toEqual({
                item: 'test',
                isBlankNode: false,
                name: 'Name'
            });
        }));
        it('when singleSelect is false', fakeAsync(function() {
            component.ngOnInit();
            component.filteredIris.subscribe(result => {
                expect(result).toEqual([this.group]);
            });
            tick();
            expect(component.selectedOptions).toEqual([{
                item: 'test',
                isBlankNode: false,
                name: 'Name'
            }]);
        }));
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.iri-select-ontology')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-autocomplete')).length).toEqual(1);
        });
        it('depending on whether it is a single select', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('input.single-input')).length).toEqual(0);
            expect(element.queryAll(By.css('input.multi-input')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-chip-list')).length).toEqual(1);

            component.singleSelect = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('input.single-input')).length).toEqual(1);
            expect(element.queryAll(By.css('input.multi-input')).length).toEqual(0);
            expect(element.queryAll(By.css('mat-chip-list')).length).toEqual(0);
        });
    });
    describe('controller methods', function() {
        describe('setRequired should handle updating required status', function() {
            it('for single select', function() {
                spyOn(component.singleControl, 'setValidators').and.callThrough();
                spyOn(component.singleControl, 'clearValidators').and.callThrough();
                component.singleSelect = true;
                component.setRequired(true);
                expect(component.singleControl.setValidators).toHaveBeenCalledWith([Validators.required]);

                component.setRequired(false);
                expect(component.singleControl.clearValidators).toHaveBeenCalledWith();
            });
            it('for multi select', function() {
                spyOn(component.multiControl, 'setValidators').and.callThrough();
                spyOn(component.multiControl, 'clearValidators').and.callThrough();
                component.setRequired(true);
                expect(component.multiControl.setValidators).toHaveBeenCalledWith([Validators.required]);

                component.setRequired(false);
                expect(component.multiControl.clearValidators).toHaveBeenCalledWith();
            });
        });
        describe('setDisabled should handle updating disabled status', function() {
            it('for single select', function() {
                component.singleSelect = true;
                component.setDisabled(true);
                expect(component.singleControl.disabled).toBeTrue();

                component.setDisabled(false);
                expect(component.singleControl.disabled).toBeFalse();
            });
            it('for multi select', function() {
                component.setDisabled(true);
                expect(component.multiControl.disabled).toBeTrue();

                component.setDisabled(false);
                expect(component.multiControl.disabled).toBeFalse();
            });
        });
        it('filter should return the list of filtered grouped IRIs', function() {
            spyOn(component, 'getOntologyIri').and.callThrough();
            utilStub.isBlankNodeId.and.callFake(a => a === 'iri3');
            spyOn(component, 'getName').and.callFake(a => a);
            expect(component.filter('I')).toEqual([
                { namespace: 'A', options: [
                    {item: 'iri1', name: 'iri1', isBlankNode: false},
                ] },
                { namespace: 'B', options: [
                    {item: 'iri2', name: 'iri2', isBlankNode: false},
                    {item: 'iri3', name: 'iri3', isBlankNode: true},
                ] },
            ]);
            Object.keys(component.selectList).forEach(iri => {
                expect(utilStub.isBlankNodeId).toHaveBeenCalledWith(iri);
                expect(component.getName).toHaveBeenCalledWith(iri, jasmine.any(Boolean));
            });
            ['iri1', 'iri2', 'iri3'].forEach(iri => {
                expect(component.getOntologyIri).toHaveBeenCalledWith(iri);
            });
        });
        describe('getOntologyIri', function() {
            it('should return the set ontology IRI from the selectList if provided', function() {
                component.selectList = { [iri]: 'new' };
                expect(component.getOntologyIri(iri)).toEqual('new');
            });
            it('should return ontologyId if iri is not set on selectList', function() {
                expect(component.getOntologyIri('test')).toEqual('ontologyId');
            });
        });
        it('getName should return the name of an iri', function() {
            ontologyStateStub.getBlankNodeValue.and.returnValue('bnode');
            ontologyStateStub.getEntityNameByListItem.and.returnValue('name');

            expect(component.getName(iri, true)).toEqual('bnode');
            expect(ontologyStateStub.getBlankNodeValue).toHaveBeenCalledWith(iri);
            expect(component.getName(iri, false)).toEqual('name');
            expect(ontologyStateStub.getEntityNameByListItem).toHaveBeenCalledWith(iri);
        });
        it('add should handle adding a chip', function() {
            utilStub.isBlankNodeId.and.returnValue(false);
            spyOn(component, 'getName').and.returnValue('name');
            component.add({chipInput: null, input: null, value: iriOption.item});
            expect(component.selected).toEqual([iriOption.item]);
            expect(component.selectedOptions).toEqual([iriOption]);
            expect(component.selectedChange.emit).toHaveBeenCalledWith([iriOption.item]);
            expect(component.multiControl.value).toEqual(null);
        });
        it('remove should handle removing a class', function() {
            component.remove(iriOption);
            expect(component.selected).toEqual([]);
            expect(component.selectedChange.emit).not.toHaveBeenCalled();

            component.selected = [iriOption.item];
            component.remove(iriOption);
            expect(component.selected).toEqual([]);
            expect(component.selectedChange.emit).toHaveBeenCalledWith([]);
        });
        describe('select should handle selecting an option in the autocomplete', function() {
            beforeEach(function() {
                component.selected = ['previous'];
            });
            it('if single select', function() {
                component.singleSelect = true;
                fixture.detectChanges();
                const event: MatAutocompleteSelectedEvent = {
                    option: {
                        value: iriOption
                    }
                } as MatAutocompleteSelectedEvent;
                component.select(event);
                expect(component.selected).toEqual([iriOption.item]);
                expect(component.selectedOptions).toEqual([]);
                expect(component.selectedChange.emit).toHaveBeenCalledWith([iriOption.item]);
            });
            it('if multi select', function() {
                fixture.detectChanges();
                const event: MatAutocompleteSelectedEvent = {
                    option: {
                        value: iriOption
                    }
                } as MatAutocompleteSelectedEvent;
                component.select(event);
                expect(component.selected).toEqual(['previous', iriOption.item]);
                expect(component.selectedOptions).toEqual([{item: 'previous', isBlankNode: undefined, name: undefined}, iriOption]);
                expect(component.selectedChange.emit).toHaveBeenCalledWith(['previous', iriOption.item]);
                expect(component.multiInput.nativeElement.value).toEqual('');
                expect(component.multiControl.value).toEqual(null);
            });
        });
    });
});
