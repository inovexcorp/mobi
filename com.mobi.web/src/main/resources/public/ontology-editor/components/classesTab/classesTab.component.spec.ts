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
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { MatDialog } from '@angular/material';

import { ClassHierarchyBlockComponent } from '../classHierarchyBlock/classHierarchyBlock.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { AnnotationBlockComponent } from '../annotationBlock/annotationBlock.component';
import { AxiomBlockComponent } from '../axiomBlock/axiomBlock.component';
import { UsagesBlockComponent } from '../usagesBlock/usagesBlock.component';
import { SelectedDetailsComponent } from '../selectedDetails/selectedDetails.component';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { ClassesTabComponent } from './classesTab.component';

describe('Classes Tab component', function() {
    let component: ClassesTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ClassesTabComponent>;
    let ontologyStateStub;
    let matDialog: jasmine.SpyObj<MatDialog>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [],
            declarations: [
                ClassesTabComponent,
                MockComponent(SelectedDetailsComponent),
                MockComponent(ClassHierarchyBlockComponent),
                MockComponent(AnnotationBlockComponent),
                MockComponent(AxiomBlockComponent),
                MockComponent(UsagesBlockComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                })}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ClassesTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        ontologyStateStub = TestBed.get(OntologyStateService);
        matDialog = TestBed.get(MatDialog);

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = { '@id': 'iri' };

        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        ontologyStateStub = null;
        matDialog = null;
        component = null;
        element = null;
        fixture = null;
    });

    it('should initialize correctly', function() {
        component.ngOnInit();
        expect(ontologyStateStub.listItem.editorTabStates.classes.element).toEqual(component.classesTab);
    });
    it('should tear down correctly', function() {
        ontologyStateStub.listItem.editorTabStates.classes.element = component.classesTab;
        component.ngOnDestroy();
        expect(ontologyStateStub.listItem.editorTabStates.classes.element).toBeUndefined();
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.classes-tab.row')).length).toEqual(1);
        });
        ['class-hierarchy-block', 'selected-details', 'annotation-block', 'axiom-block', 'usages-block'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with a button to delete a class if the user can modify', function() {
            ontologyStateStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            const button = element.queryAll(By.css('.selected-header button[color="warn"]'));
            expect(button.length).toEqual(1);
            expect(button[0].nativeElement.textContent.trim()).toEqual('Delete');
        });
        it('with no button to delete a class if the user cannot modify', function() {
            ontologyStateStub.canModify.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-header button[color="warn"]')).length).toEqual(0);
        });
        it('with a button to see the class history', function() {
            const button = element.queryAll(By.css('.selected-header button[color="primary"]'));
            expect(button.length).toEqual(1);
            expect(button[0].nativeElement.textContent.trim()).toEqual('See History');
        });
        it('depending on whether something is selected', function() {
            expect(element.queryAll(By.css('.selected-class div')).length).toBeGreaterThan(0);

            ontologyStateStub.listItem.selected = undefined;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-class div')).length).toEqual(0);
        });
        it('depending on whether the selected class is imported', function() {
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
        it('should open a delete confirmation modal', function() {
            component.showDeleteConfirmation();
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: 
                {content: '<p>Are you sure you want to delete <strong>iri</strong>?</p>'}});
        });
        it('should show a class history', function() {
            component.seeHistory();
            expect(ontologyStateStub.listItem.seeHistory).toEqual(true);
        });
    });
    it('should call showDeleteConfirmation when the delete button is clicked', function() {
        ontologyStateStub.canModify.and.returnValue(true);
        fixture.detectChanges();
        spyOn(component, 'showDeleteConfirmation');
        const button = element.queryAll(By.css('.selected-header button[color="warn"]'))[0];
        button.triggerEventHandler('click', null);
        expect(component.showDeleteConfirmation).toHaveBeenCalledWith();
    });
    it('should call seeHistory when the see history button is clicked', function() {
        spyOn(component, 'seeHistory');
        const button = element.queryAll(By.css('.selected-header button[color="primary"]'))[0];
        button.triggerEventHandler('click', null);
        expect(component.seeHistory).toHaveBeenCalledWith();
    });
});
