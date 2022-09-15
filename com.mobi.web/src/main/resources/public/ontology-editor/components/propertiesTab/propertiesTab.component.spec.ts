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
import { MatDialog } from '@angular/material';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { SelectedDetailsComponent } from '../selectedDetails/selectedDetails.component';
import { AnnotationBlockComponent } from '../annotationBlock/annotationBlock.component';
import { AxiomBlockComponent } from '../axiomBlock/axiomBlock.component';
import { CharacteristicsRowComponent } from '../characteristicsRow/characteristicsRow.component';
import { UsagesBlockComponent } from '../usagesBlock/usagesBlock.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { SharedModule } from '../../../shared/shared.module';
import { PropertyHierarchyBlockComponent } from '../propertyHierarchyBlock/propertyHierarchyBlock.component';
import { PropertiesTabComponent } from './propertiesTab.component';

describe('Properties Tab component', function() {
    let component: PropertiesTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PropertiesTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let dialogStub: jasmine.SpyObj<MatDialog>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                PropertiesTabComponent,
                MockComponent(SelectedDetailsComponent),
                MockComponent(PropertyHierarchyBlockComponent),
                MockComponent(AxiomBlockComponent),
                MockComponent(CharacteristicsRowComponent),
                MockComponent(AnnotationBlockComponent),
                MockComponent(UsagesBlockComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    }) }
            ]
        });
    });
    
    beforeEach(function() {
        fixture = TestBed.createComponent(PropertiesTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);
        ontologyManagerStub = TestBed.get(OntologyManagerService);
        dialogStub = TestBed.get(MatDialog);

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = {
            '@id': 'axiom1',
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2', '@type': 'type', '@language': 'language'}]
        };
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        fixture = null;
        component = null;
        element = null;
        ontologyStateStub = null;
        ontologyManagerStub = null;
        dialogStub = null;
    });

    it('should initialize correctly', function() {
        component.ngOnInit();
        expect(ontologyStateStub.listItem.editorTabStates.properties.element).toEqual(component.propertiesTab);
    });
    it('should tear down correctly', function() {
        ontologyStateStub.listItem.editorTabStates.properties.element = component.propertiesTab;
        component.ngOnDestroy();
        expect(ontologyStateStub.listItem.editorTabStates.properties.element).toBeUndefined();
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.properties-tab.row')).length).toEqual(1);
        });
        ['property-hierarchy-block', 'selected-details', 'annotation-block', 'characteristics-row', 'usages-block'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with an axiom-block', function() {
            expect(element.queryAll(By.css('axiom-block')).length).toEqual(1);
            ontologyManagerStub.isAnnotation.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('axiom-block')).length).toEqual(0);
        });
        it('with a button to delete a property if a user can modify', function() {
            ontologyStateStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            const button = element.queryAll(By.css('.selected-header button[color="warn"]'));
            expect(button.length).toEqual(1);
            expect(button[0].nativeElement.textContent.trim()).toContain('Delete');
        });
        it('with no button to delete a property if a user cannot modify', function() {
            ontologyStateStub.canModify.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-header button[color="warn"]')).length).toEqual(0);
        });
        it('with a button to see the property history', function() {
            const button = element.queryAll(By.css('.selected-header button[color="primary"]'));
            expect(button.length).toEqual(1);
            expect(button[0].nativeElement.textContent.trim()).toEqual('See History');
        });
        it('depending on whether something is selected', function() {
            expect(element.queryAll(By.css('.selected-property div')).length).toBeGreaterThan(0);

            ontologyStateStub.listItem.selected = undefined;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-property div')).length).toEqual(0);
        });
        it('depending on whether the selected property is imported', function() {
            ontologyStateStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            const historyButton = element.queryAll(By.css('.selected-header button[color="primary"]'))[0];
            const deleteButton = element.queryAll(By.css('.selected-header button[color="warn"]'))[0];
            expect(historyButton.properties['disabled']).toBeFalsy();
            expect(deleteButton.properties['disabled']).toBeFalsy();

            ontologyStateStub.isSelectedImported.and.returnValue(true);
            fixture.detectChanges();
            expect(historyButton.properties['disabled']).toBeTruthy();
            expect(deleteButton.properties['disabled']).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('showDeleteConfirmation opens a delete confirmation modal', function() {
            component.showDeleteConfirmation();
            expect(dialogStub.open).toHaveBeenCalledWith(ConfirmModalComponent, {
                data: {
                    content: '<p>Are you sure that you want to delete <strong>axiom1</strong>?</p>'}});
        });
        it('should show a class history', function() {
            component.seeHistory();
            expect(ontologyStateStub.listItem.seeHistory).toEqual(true);
        });
        describe('should delete', function() {
            it('an object property', function() {
                ontologyManagerStub.isObjectProperty.and.returnValue(true);
                component.deleteProperty();
                expect(ontologyManagerStub.isObjectProperty).toHaveBeenCalledWith(ontologyStateStub.listItem.selected);
                expect(ontologyStateStub.deleteDataTypeProperty).not.toHaveBeenCalled();
                expect(ontologyStateStub.deleteObjectProperty).toHaveBeenCalledWith();
                expect(ontologyStateStub.deleteAnnotationProperty).not.toHaveBeenCalled();
            });
            it('a datatype property', function() {
                ontologyManagerStub.isDataTypeProperty.and.returnValue(true);
                component.deleteProperty();
                expect(ontologyManagerStub.isObjectProperty).toHaveBeenCalledWith(ontologyStateStub.listItem.selected);
                expect(ontologyManagerStub.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateStub.listItem.selected);
                expect(ontologyStateStub.deleteDataTypeProperty).toHaveBeenCalledWith();
                expect(ontologyStateStub.deleteObjectProperty).not.toHaveBeenCalled();
                expect(ontologyStateStub.deleteAnnotationProperty).not.toHaveBeenCalled();
            });
            it('an annotation property', function() {
                ontologyManagerStub.isAnnotation.and.returnValue(true);
                component.deleteProperty();
                expect(ontologyManagerStub.isObjectProperty).toHaveBeenCalledWith(ontologyStateStub.listItem.selected);
                expect(ontologyManagerStub.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateStub.listItem.selected);
                expect(ontologyManagerStub.isAnnotation).toHaveBeenCalledWith(ontologyStateStub.listItem.selected);
                expect(ontologyStateStub.deleteDataTypeProperty).not.toHaveBeenCalled();
                expect(ontologyStateStub.deleteObjectProperty).not.toHaveBeenCalled();
                expect(ontologyStateStub.deleteAnnotationProperty).toHaveBeenCalledWith();
            });
        });
    });
    it('should call seeHistory when the see history button is clicked', function() {
        spyOn(component, 'seeHistory');
        const button = element.queryAll(By.css('.selected-header button[color="primary"]'))[0];
        button.triggerEventHandler('click', null);
        expect(component.seeHistory).toHaveBeenCalledWith();
    });
    it('should call showDeleteConfirmation when the delete button is clicked', function() {
        ontologyStateStub.canModify.and.returnValue(true);
        fixture.detectChanges();
        spyOn(component, 'showDeleteConfirmation');
        const button = element.queryAll(By.css('.selected-header button[color="warn"]'))[0];
        button.triggerEventHandler('click', null);
        expect(component.showDeleteConfirmation).toHaveBeenCalledWith();
    });
});
