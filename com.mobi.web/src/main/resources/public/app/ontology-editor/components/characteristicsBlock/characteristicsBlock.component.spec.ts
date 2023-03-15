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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { some } from 'lodash';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OWL } from '../../../prefixes';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CharacteristicsBlockComponent } from './characteristicsBlock.component';

describe('Characteristics Block component', function() {
    let component: CharacteristicsBlockComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CharacteristicsBlockComponent>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatCheckboxModule,
                FormsModule,
                ReactiveFormsModule
            ],
            declarations: [
                CharacteristicsBlockComponent,
            ],
            providers: [
                MockProvider(OntologyManagerService),
                MockProvider(OntologyStateService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CharacteristicsBlockComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));

        component.types = [];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        ontologyManagerStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.characteristics-block')).length).toEqual(1);
        });
        it('with a .section-header', function() {
            expect(element.queryAll(By.css('.section-header')).length).toEqual(1);
        });
        describe('with checkboxes if a', function() {
            it('object property is selected', function() {
                ontologyManagerStub.isObjectProperty.and.returnValue(true);
                component.ngOnChanges();
                fixture.detectChanges();
                expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(6);
            });
            it('data property is selected', function() {
                component.ngOnChanges();
                fixture.detectChanges();
                expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(1);
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.id = 'id';
            this.statement = {
                '@id': this.id,
                '@type': [OWL + 'FunctionalProperty']
            };
            this.characteristicObj = {
                checked: true,
                typeIRI: OWL + 'FunctionalProperty',
                displayText: '',
                objectOnly: false
            };
            component.iri = this.id;
            spyOn(component.typesChange, 'emit');
        });
        describe('onChange sets all variables correctly when characteristic', function() {
            it('is checked and no match in deletions', function() {
                component.onChange(this.characteristicObj, true);
                expect(this.characteristicObj.checked).toEqual(true);
                expect(component.types).toContain(OWL + 'FunctionalProperty');
                expect(component.typesChange.emit).toHaveBeenCalledWith(component.types);
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, this.statement);
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith(ontologyStateStub.listItem, false);
            });
            it('is checked and the statement is in deletions', function() {
                ontologyStateStub.listItem.deletions = [Object.assign({}, this.statement)];
                component.onChange(this.characteristicObj, true);
                expect(this.characteristicObj.checked).toEqual(true);
                expect(component.types).toContain(OWL + 'FunctionalProperty');
                expect(component.typesChange.emit).toHaveBeenCalledWith(component.types);
                expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateStub.listItem.deletions.length).toEqual(0);
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith(ontologyStateStub.listItem, false);
            });
            it('is checked and the statement with another property is in deletions', function() {
                const object = Object.assign({}, this.statement);
                object.other = 'value';
                ontologyStateStub.listItem.deletions = [object];
                component.onChange(this.characteristicObj, true);
                expect(this.characteristicObj.checked).toEqual(true);
                expect(component.types).toContain(OWL + 'FunctionalProperty');
                expect(component.typesChange.emit).toHaveBeenCalledWith(component.types);
                expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                expect(some(ontologyStateStub.listItem.deletions, {'@id': this.id, other: 'value'})).toEqual(true);
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith(ontologyStateStub.listItem, false);
            });
            it('is not checked and no match in additions', function() {
                ontologyStateStub.listItem.selected = Object.assign({}, this.statement);
                component.onChange(this.characteristicObj, false);
                expect(this.characteristicObj.checked).toEqual(false);
                expect(component.types).not.toContain(OWL + 'FunctionalProperty');
                expect(component.typesChange.emit).toHaveBeenCalledWith(component.types);
                expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, this.statement);
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith(ontologyStateStub.listItem, false);
            });
            it('is not checked and the statement is in additions', function() {
                ontologyStateStub.listItem.additions = [Object.assign({}, this.statement)];
                ontologyStateStub.listItem.selected = Object.assign({}, this.statement);
                component.onChange(this.characteristicObj, false);
                expect(this.characteristicObj.checked).toEqual(false);
                expect(component.types).not.toContain(OWL + 'FunctionalProperty');
                expect(component.typesChange.emit).toHaveBeenCalledWith(component.types);
                expect(ontologyStateStub.addToDeletions).not.toHaveBeenCalled();
                expect(ontologyStateStub.listItem.additions.length).toEqual(0);
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith(ontologyStateStub.listItem, false);
            });
            it('is not checked and the statement is in additions', function() {
                const object = Object.assign({}, this.statement);
                object.other = 'value';
                ontologyStateStub.listItem.additions = [object];
                ontologyStateStub.listItem.selected = Object.assign({}, this.statement);
                component.onChange(this.characteristicObj, false);
                expect(this.characteristicObj.checked).toEqual(false);
                expect(component.types).not.toContain(OWL + 'FunctionalProperty');
                expect(component.typesChange.emit).toHaveBeenCalledWith(component.types);
                expect(ontologyStateStub.addToDeletions).not.toHaveBeenCalled();
                expect(some(ontologyStateStub.listItem.additions, {'@id': this.id, other: 'value'})).toEqual(true);
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith(ontologyStateStub.listItem, false);
            });
        });
    });
    it('correctly updates the checkboxes when the types change', function() {
        component.characteristics.forEach(obj => {
            obj.checked = false;
        });
        spyOn(component, 'onChange');
        component.types = [OWL + 'FunctionalProperty', OWL + 'AsymmetricProperty', OWL + 'SymmetricProperty', OWL + 'TransitiveProperty', OWL + 'ReflexiveProperty', OWL + 'IrreflexiveProperty'];
        component.ngOnChanges();
        expect(component.onChange).not.toHaveBeenCalled();
        component.characteristics.forEach(obj => {
            expect(obj.checked).toEqual(true);
        });
    });
});
