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
import { MatButtonModule, MatDialog, MatDialogModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyCloseOverlayComponent } from '../ontologyCloseOverlay/ontologyCloseOverlay.component';
import { OpenOntologySelectComponent } from '../openOntologySelect/openOntologySelect.component';
import { OntologySidebarComponent } from './ontologySidebar.component';

describe('Ontology Sidebar component', function() {
    let component: OntologySidebarComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OntologySidebarComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let matDialog: jasmine.SpyObj<MatDialog>;

    let listItemA: OntologyListItem;
    let listItemB: OntologyListItem;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                MatButtonModule,
                MatDialogModule
             ],
            declarations: [
                OntologySidebarComponent,
                MockComponent(OpenOntologySelectComponent),
                MockComponent(OntologyCloseOverlayComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                }) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(OntologySidebarComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);
        matDialog = TestBed.get(MatDialog);

        listItemA = new OntologyListItem();
        listItemA.ontologyId = 'A';
        listItemA.versionedRdfRecord.recordId = 'A';
        listItemA.versionedRdfRecord.title = 'A';
        listItemA.editorTabStates.project.element = 'test';
        listItemA.editorTabStates.classes.component = undefined;

        listItemB = new OntologyListItem();
        listItemB.ontologyId = 'B';
        listItemB.versionedRdfRecord.recordId = 'B';
        listItemB.versionedRdfRecord.title = 'B';

        component.list = [listItemA, listItemB];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        matDialog = null;
        listItemA = null;
        listItemB = null;
    });

    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateStub.listItem = listItemA;
        });
        describe('should close a tab', function() {
            beforeEach(function() {
                listItemA.openSnackbar = jasmine.createSpyObj('MatSnackBar', ['dismiss']);
            });
            it('if it has changes', function() {
                ontologyStateStub.hasChanges.and.returnValue(true);
                component.onClose(listItemA);
                expect(listItemA.openSnackbar.dismiss).toHaveBeenCalledWith();
                expect(matDialog.open).toHaveBeenCalledWith(OntologyCloseOverlayComponent, {data: {listItem: listItemA}});
                expect(ontologyStateStub.closeOntology).not.toHaveBeenCalled();
            });
            it('if it has no changes', function() {
                ontologyStateStub.hasChanges.and.returnValue(false);
                component.onClose(listItemA);
                expect(listItemA.openSnackbar.dismiss).toHaveBeenCalledWith();
                expect(matDialog.open).not.toHaveBeenCalled();
                expect(ontologyStateStub.closeOntology).toHaveBeenCalledWith(listItemA.versionedRdfRecord.recordId);
            });
        });
        describe('onClick should set the listItem and active state correctly if listItem is', function() {
            beforeEach(function () {
                ontologyStateStub.listItem = listItemA;
                listItemA.active = true;
            });
            describe('defined', function() {
                it('and does not have an entity snackbar open', function() {
                    ontologyStateStub.listItem.openSnackbar = null;
                    component.onClick(listItemB);
                    expect(listItemB.active).toBeTrue();
                    expect(ontologyStateStub.listItem).toEqual(listItemB);
                    expect(listItemA.active).toBeFalse();
                    expect(listItemA.editorTabStates.project.element).toBeUndefined();
                    expect(listItemA.editorTabStates.classes.element).toBeUndefined();
                    expect(listItemA.editorTabStates.search.element).toBeUndefined();
                    expect(listItemA.openSnackbar).toBeNull();
                });
                it('and does have an entity snackbar open', function() {
                    listItemA.openSnackbar = jasmine.createSpyObj('MatSnackBar', ['dismiss']);
                    component.onClick(listItemB);
                    expect(listItemB.active).toBeTrue();
                    expect(ontologyStateStub.listItem).toEqual(listItemB);
                    expect(listItemA.active).toBeFalse();
                    expect(listItemA.editorTabStates.project.element).toBeUndefined();
                    expect(listItemA.editorTabStates.classes.element).toBeUndefined();
                    expect(listItemA.editorTabStates.search.element).toBeUndefined();
                    expect(listItemA.openSnackbar.dismiss).toHaveBeenCalledWith();
                });
            });
            it('undefined', function() {
                component.onClick(undefined);
                expect(ontologyStateStub.listItem).toBeUndefined();
                expect(listItemA.active).toBeFalse();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.ontology-sidebar')).length).toEqual(1);
            expect(element.queryAll(By.css('.button-container')).length).toEqual(1);
        });
        it('with a .nav', function() {
            expect(element.queryAll(By.css('ul.nav')).length).toEqual(1);
        });
        it('depending on how many ontologies are open', function() {
            fixture.detectChanges();
            const tabs = element.queryAll(By.css('li.nav-item'));
            expect(tabs.length).toEqual(component.list.length);
        });
        it('depending on whether an ontology is open', function() {
            listItemA.active = true;
            fixture.detectChanges();
            const tab = element.queryAll(By.css('li.nav-item'))[0];
            expect(tab.classes['active']).toBeTruthy();
            expect(tab.queryAll(By.css('open-ontology-select')).length).toEqual(1);
        });
    });
    it('should call onClick when the Ontologies button is clicked', function() {
        spyOn(component, 'onClick');
        const button = element.queryAll(By.css('.button-container button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.onClick).toHaveBeenCalledWith();
    });
    it('should call onClick when an ontology nav item is clicked', function() {
        fixture.detectChanges();
        spyOn(component, 'onClick');
        const button = element.queryAll(By.css('a.nav-link'))[0];
        button.triggerEventHandler('click', null);
        expect(component.onClick).toHaveBeenCalledWith(listItemA);
    });
    it('should call onClose when a close icon on an ontology nav item is clicked', function() {
        fixture.detectChanges();
        spyOn(component, 'onClose');
        const button = element.queryAll(By.css('.nav-item span.close-icon'))[0];
        button.triggerEventHandler('click', null);
        expect(component.onClose).toHaveBeenCalledWith(listItemA);
    });
});
