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
import { DebugElement, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { BlankNodeValueDisplayComponent } from '../../../shared/components/blankNodeValueDisplay/blankNodeValueDisplay.component';
import { ValueDisplayComponent } from '../../../shared/components/valueDisplay/valueDisplay.component';
import { HighlightTextPipe } from '../../../shared/pipes/highlightText.pipe';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { UtilService } from '../../../shared/services/util.service';
import { PropertyValuesComponent } from './propertyValues.component';

describe('Property Values component', function() {
    let component: PropertyValuesComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PropertyValuesComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const property = 'property';
    const entity = {
        '@id': 'entity',
        [property]: [
            {'@value': 'value'},
            {'@id': 'id'},
            {'@id': '_:bnode'},
        ]
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatButtonModule,
                MatIconModule,
            ],
            declarations: [
                PropertyValuesComponent,
                MockComponent(ValueDisplayComponent),
                MockComponent(BlankNodeValueDisplayComponent),
                MockPipe(HighlightTextPipe)
            ],
            providers: [
                MockProvider(OntologyManagerService),
                MockProvider(OntologyStateService),
                MockProvider(UtilService),
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PropertyValuesComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;

        ontologyStateStub.isLinkable.and.callFake(id => id === 'id');
        utilStub.isBlankNodeId.and.callFake(id => id === '_:bnode');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        utilStub = null;
    });

    describe('should handle changes to', function() {
        beforeEach(function() {
            component.property = property;
        });
        it('the highlighIris', function() {
            const change = new SimpleChange([], ['other', property], true);
            component.ngOnChanges({highlightIris: change});
            expect(component.isHighlightedProp).toBeTrue();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.property-values')).length).toEqual(1);
            expect(element.queryAll(By.css('.prop-header')).length).toEqual(1);
        });
        it('based on the number of values', function() {
            component.property = property;
            component.entity = entity;
            fixture.detectChanges();
            const values = element.queryAll(By.css('.prop-value-container'));
            expect(values.length).toEqual(3);
        });
        it('depending on whether a value is a blank node and user can modify', function() {
            component.property = property;
            component.entity = entity;
            ontologyStateStub.canModify.and.returnValue(true);
            component.edit.subscribe();
            component.remove.subscribe();
            fixture.detectChanges();
            const blankNodeValue = element.queryAll(By.css('.prop-value-container .value-display-wrapper blank-node-value-display'));
            expect(blankNodeValue.length).toEqual(1);
            const editButtons = element.queryAll(By.css('.prop-value-container [title=Edit]'));
            expect(editButtons.length).toEqual(2);
            const deleteButtons = element.queryAll(By.css('.prop-value-container [title=Delete]'));
            expect(deleteButtons.length).toEqual(3);
        });
        it('depending on whether a value is a blank node and user cannot modify', function() {
            component.property = property;
            component.entity = entity;
            ontologyStateStub.canModify.and.returnValue(false);
            fixture.detectChanges();
            const blankNodeValue = element.queryAll(By.css('.prop-value-container .value-display-wrapper blank-node-value-display'));
            expect(blankNodeValue.length).toEqual(1);
            const editButtons = element.queryAll(By.css('.prop-value-container [title=Edit]'));
            expect(editButtons.length).toEqual(0);
            const deleteButtons = element.queryAll(By.css('.prop-value-container [title=Delete]'));
            expect(deleteButtons.length).toEqual(0);
        });
        it('depending on whether a value is linkable', function() {
            component.property = property;
            component.entity = entity;
            fixture.detectChanges();
            const link = element.queryAll(By.css('.prop-value-container .value-display-wrapper a'));
            expect(link.length).toEqual(1);
            expect(link[0].nativeElement.textContent.trim()).toContain('id');
        });
    });
    describe('controller method', function() {
        it('should call the edit function', function() {
            spyOn(component.edit, 'emit');
            component.property = property;
            component.callEdit(0);
            expect(component.edit.emit).toHaveBeenCalledWith({ property, index: 0 });
        });
        it('should call the remove function', function() {
            spyOn(component.remove, 'emit');
            component.property = property;
            component.callRemove(0);
            expect(component.remove.emit).toHaveBeenCalledWith({ iri: property, index: 0 });
        });
    });
    // it('should call edit when the appropriate button is clicked', function() {
    //     ontologyStateStub.canModify.and.returnValue(true);
    //     fixture.detectChanges();
    //     var editButton = angular.element(element.queryAll(By.css('.prop-value-container [title=Edit]'))[0]);
    //     editButton.triggerHandler('click');
    //     expect(scope.edit).toHaveBeenCalledWith(this.controller.property, 0);
    // });
    // it('should call remove when the appropriate button is clicked', function() {
    //     ontologyStateStub.canModify.and.returnValue(true);
    //     fixture.detectChanges();
    //     var removeButton = angular.element(element.queryAll(By.css('.prop-value-container [title=Delete]'))[0]);
    //     removeButton.triggerHandler('click');
    //     expect(scope.remove).toHaveBeenCalledWith(this.controller.property, 0);
    // });
});
