/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { CircleButtonStackComponent } from '../../../shared/components/circleButtonStack/circleButtonStack.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CreateEntityModalComponent } from '../createEntityModal/createEntityModal.component';
import { OntologyButtonStackComponent } from './ontologyButtonStack.component';

describe('Ontology Button Stack component', function() {
    let component: OntologyButtonStackComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OntologyButtonStackComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let matDialogStub: jasmine.SpyObj<MatDialog>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                MatIconModule,
                MatButtonModule
            ],
            declarations: [
                OntologyButtonStackComponent,
                MockComponent(CircleButtonStackComponent),
            ],
            providers: [
                MockProvider(MatDialog),
                MockProvider(OntologyStateService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(OntologyButtonStackComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        matDialogStub = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
       
        ontologyStateStub.isCommittable.and.returnValue(false);
        ontologyStateStub.hasChanges.and.returnValue(false);
        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.userBranch = false;
        ontologyStateStub.listItem.userCanModify = true;
        ontologyStateStub.canModify.and.returnValue(true);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        matDialogStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.ontology-button-stack')).length).toEqual(1);
        });
        it('with a button', function() {
            expect(element.queryAll(By.css('button')).length).toEqual(1);
        });
        it('depending on if the user cannot modify the record', function() {
            ontologyStateStub.canModify.and.returnValue(false);
            fixture.detectChanges();
            const createEntityButton = element.queryAll(By.css('button[color="primary"]'))[0];
            expect(createEntityButton.properties['disabled']).toBeTruthy();

            ontologyStateStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            expect(createEntityButton.properties['disabled']).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('should open the createEntityModal', function() {
            it('if the current page is the project tab', function() {
                ontologyStateStub.getActiveKey.and.returnValue('project');
                component.showCreateEntityOverlay();
                expect(ontologyStateStub.unSelectItem).not.toHaveBeenCalled();
                expect(matDialogStub.open).toHaveBeenCalledWith(CreateEntityModalComponent);
            });
            it('if the current page is not the project tab', function() {
                ontologyStateStub.getActiveKey.and.returnValue('classes');
                component.showCreateEntityOverlay();
                expect(ontologyStateStub.unSelectItem).toHaveBeenCalledWith();
                expect(matDialogStub.open).toHaveBeenCalledWith(CreateEntityModalComponent);
            });
        });
    });
    it('should call showCreateEntityOverlay when the create entity button is clicked', function() {
        spyOn(component, 'showCreateEntityOverlay');
        const button = (element.queryAll(By.css('button[color="primary"]'))[0]);
        button.nativeElement.click();
        expect(component.showCreateEntityOverlay).toHaveBeenCalledWith();
    });
});
