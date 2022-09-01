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
import { IndividualsTabComponent} from './individualsTab.component';
import { OntologyStateService} from '../../../shared/services/ontologyState.service';
import { OntologyManagerService} from '../../../shared/services/ontologyManager.service';
import { SharedModule} from '../../../shared/shared.module';
import { IndividualHierarchyBlockComponent} from '../individualHierarchyBlock/individualHierarchyBlock.component';
import { SelectedDetailsComponent} from '../selectedDetails/selectedDetails.component';
import { DatatypePropertyBlockComponent} from '../datatypePropertyBlock/datatypePropertyBlock.component';
import { ObjectPropertyBlockComponent} from '../objectPropertyBlock/objectPropertyBlock.component';
import { AnnotationBlockComponent} from '../annotationBlock/annotationBlock.component';
import { OntologyListItem} from '../../../shared/models/ontologyListItem.class';
import { cleanStylesFromDOM} from '../../../../../../test/ts/Shared';
import {ConfirmModalComponent} from '../../../shared/components/confirmModal/confirmModal.component';

describe('Individuals Tab component', function() {
    let component: IndividualsTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<IndividualsTabComponent>;
    let ontologyStateServiceStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerServiceStub: jasmine.SpyObj<OntologyManagerService>;
    let dialogStub : jasmine.SpyObj<MatDialog>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                IndividualsTabComponent,
                MockComponent(IndividualHierarchyBlockComponent),
                MockComponent(SelectedDetailsComponent),
                MockComponent(DatatypePropertyBlockComponent),
                MockComponent(ObjectPropertyBlockComponent),
                MockComponent(AnnotationBlockComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    }) }
            ]
        })
    })

    beforeEach(function() {
        fixture = TestBed.createComponent(IndividualsTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateServiceStub = TestBed.get(OntologyStateService);
        ontologyManagerServiceStub = TestBed.get(OntologyManagerService);
        dialogStub = TestBed.get(MatDialog);

        ontologyStateServiceStub.listItem = new OntologyListItem();
        ontologyStateServiceStub.listItem.selected = {
            '@id': 'individual',
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
        ontologyStateServiceStub = null;
        ontologyManagerServiceStub = null;
        dialogStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.individuals-tab.row')).length).toEqual(1);
        });
        ['individual-hierarchy-block', 'selected-details', 'datatype-property-block', 'object-property-block', 'annotation-block'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with a button to delete an individual if a user can modify', function() {
            ontologyStateServiceStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            const button = element.queryAll(By.css('.selected-header button.btn-danger'));
            expect(button.length).toEqual(1);
            expect(button[0].nativeElement.textContent.trim()).toContain('Delete');
        });
        it('with no button to delete an individual if a user cannot modify', function() {
            ontologyStateServiceStub.canModify.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-header button.btn-danger')).length).toEqual(0);
        });
        it('with a button to see the individual history', function() {
            const button = element.queryAll(By.css('.selected-header button.btn-primary'));
            expect(button.length).toEqual(1);
            expect(button[0].nativeElement.textContent.trim()).toEqual('See History');
        });
        it('based on whether something is selected', function() {
            expect(element.queryAll(By.css('.selected-individual div')).length).toBeGreaterThan(0);

            ontologyStateServiceStub.listItem.selected = undefined;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-individual div')).length).toEqual(0);
        });
        it('depending on whether the selected individual is imported', function() {
            ontologyStateServiceStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            const historyButton = element.queryAll(By.css('.selected-header button.btn-primary'))[0];
            const deleteButton = element.queryAll(By.css('.selected-header button.btn-danger'))[0];
            expect(historyButton.properties['disabled']).toBeFalsy();
            expect(deleteButton.properties['disabled']).toBeFalsy();

            ontologyStateServiceStub.isSelectedImported.and.returnValue(true);
            fixture.detectChanges();
            expect(historyButton.properties['disabled']).toBeTruthy();
            expect(deleteButton.properties['disabled']).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should open a delete confirmation modal', function() {
            component.showDeleteConfirmation();
            expect(dialogStub.open).toHaveBeenCalledWith(ConfirmModalComponent, {
                data: {
                    body: '<p>Are you sure that you want to delete <strong>individual</strong>?</p>'
                }
            });
        });
        it('should show a class history', function() {
            component.seeHistory();
            expect(ontologyStateServiceStub.listItem.seeHistory).toEqual(true);
        });
    });
    it('should call seeHistory when the see history button is clicked', function() {
        spyOn(component, 'seeHistory');
        const button = element.queryAll(By.css('.selected-header button.btn-primary'))[0];
        button.triggerEventHandler('click', null);
        expect(component.seeHistory).toHaveBeenCalled();
    });
    it('should call showDeleteConfirmation when the delete button is clicked', function() {
        ontologyStateServiceStub.canModify.and.returnValue(true);
        fixture.detectChanges();
        spyOn(component, 'showDeleteConfirmation');
        const button = element.queryAll(By.css('.selected-header button.btn-danger'))[0];
        button.triggerEventHandler('click', null);
        expect(component.showDeleteConfirmation).toHaveBeenCalled();
    });
});
