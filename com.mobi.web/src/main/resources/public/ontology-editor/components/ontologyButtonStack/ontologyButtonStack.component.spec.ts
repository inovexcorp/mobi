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
import { MatButtonModule, MatDialog, MatIconModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { CircleButtonStackComponent } from '../../../shared/components/circleButtonStack/circleButtonStack.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CommitOverlayComponent } from '../commitOverlay/commitOverlay.component';
import { CreateBranchOverlayComponent } from '../createBranchOverlay/createBranchOverlay.component';
import { CreateEntityModalComponent } from '../createEntityModal/createEntityModal.component';
import { CreateTagOverlayComponent } from '../createTagOverlay/createTagOverlay.component';
import { UploadChangesOverlayComponent } from '../uploadChangesOverlay/uploadChangesOverlay.component';
import { OntologyButtonStackComponent } from './ontologyButtonStack.component';

describe('Ontology Button Stack component', function() {
    let component: OntologyButtonStackComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OntologyButtonStackComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let matDialogStub: jasmine.SpyObj<MatDialog>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
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
        ontologyStateStub = TestBed.get(OntologyStateService);
        matDialogStub = TestBed.get(MatDialog);
       
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
        it('with a circle-button-stack', function() {
            expect(element.queryAll(By.css('circle-button-stack')).length).toEqual(1);
        });
        it('with buttons', function() {
            expect(element.queryAll(By.css('button')).length).toEqual(6);
        });
        it('depending on whether the ontology is committable', function() {
            ontologyStateStub.listItem.versionedRdfRecord.branchId = 'branch';
            fixture.detectChanges();
            const uploadButton = element.queryAll(By.css('button.upload-circle-button'))[0];
            const tagButton = element.queryAll(By.css('button.btn-dark'))[0];
            const commitButton = element.queryAll(By.css('button.btn-info'))[0];
            const mergeButton = element.queryAll(By.css('button.btn-success'))[0];
            expect(tagButton.properties['disabled']).toBeFalsy();
            expect(uploadButton.properties['disabled']).toBeFalsy();
            expect(commitButton.properties['disabled']).toBeTruthy();
            expect(mergeButton.properties['disabled']).toBeFalsy();

            ontologyStateStub.isCommittable.and.returnValue(true);
            fixture.detectChanges();
            expect(tagButton.properties['disabled']).toBeTruthy();
            expect(uploadButton.properties['disabled']).toBeTruthy();
            expect(commitButton.properties['disabled']).toBeFalsy();
            expect(mergeButton.properties['disabled']).toBeTruthy();
        });
        it('depending on whether the ontology has changes', function() {
            const tagButton = (element.queryAll(By.css('button.btn-dark'))[0]);
            const mergeButton = (element.queryAll(By.css('button.btn-success'))[0]);
            expect(tagButton.properties['disabled']).toBeFalsy();
            expect(mergeButton.properties['disabled']).toBeFalsy();

            ontologyStateStub.hasChanges.and.returnValue(true);
            fixture.detectChanges();
            expect(tagButton.properties['disabled']).toBeTruthy();
            expect(mergeButton.properties['disabled']).toBeTruthy();
        });
        it('depending on whether the branch is a user branch', function() {
            const mergeButton = (element.queryAll(By.css('button.btn-success'))[0]);
            expect(mergeButton.properties['disabled']).toBeFalsy();

            ontologyStateStub.listItem.userBranch = true;
            fixture.detectChanges();
            expect(mergeButton.properties['disabled']).toBeTruthy();
        });
        it('depending on whether the branch is out of date', function() {
            const mergeButton = (element.queryAll(By.css('button.btn-success'))[0]);
            expect(mergeButton.properties['disabled']).toBeFalsy();

            ontologyStateStub.listItem.upToDate = false;
            fixture.detectChanges();
            expect(mergeButton.properties['disabled']).toBeTruthy();
        });
        it('depending on if the user cannot modify the record', function() {
            ontologyStateStub.listItem.userCanModify = false;
            ontologyStateStub.canModify.and.returnValue(false);
            fixture.detectChanges();
            const tagButton = element.queryAll(By.css('button.btn-dark'))[0];
            const uploadButton = element.queryAll(By.css('button.upload-circle-button'))[0];
            const branchButton = element.queryAll(By.css('button.btn-warning'))[0];
            const commitButton = element.queryAll(By.css('button.btn-info'))[0];
            const createEntityButton = element.queryAll(By.css('button[color="primary"]'))[0];
            const mergeButton = element.queryAll(By.css('button.btn-success'))[0];
            expect(tagButton.properties['disabled']).toBeTruthy();
            expect(uploadButton.properties['disabled']).toBeTruthy();
            expect(branchButton.properties['disabled']).toBeTruthy();
            expect(commitButton.properties['disabled']).toBeTruthy();
            expect(createEntityButton.properties['disabled']).toBeTruthy();
            expect(mergeButton.properties['disabled']).toBeTruthy();
        });
        it('depending on whether the ontology is open on a branch', function() {
            ontologyStateStub.isCommittable.and.returnValue(true);
            fixture.detectChanges();
            const commitButton = element.queryAll(By.css('button.btn-info'))[0];
            expect(commitButton.properties['disabled']).toBeTruthy();

            ontologyStateStub.listItem.versionedRdfRecord.branchId = 'branch';
            fixture.detectChanges();
            expect(commitButton.properties['disabled']).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('should open the CreateTagOverlay', function() {
            component.showCreateTagModal();
            expect(matDialogStub.open).toHaveBeenCalledWith(CreateTagOverlayComponent, {autoFocus: false});
        });
        it('should open the createBranchOverlay', function() {
            component.showCreateBranchOverlay();
            expect(matDialogStub.open).toHaveBeenCalledWith(CreateBranchOverlayComponent);
        });
        it('should open the commitOverlay', function() {
            component.showCommitOverlay();
            expect(matDialogStub.open).toHaveBeenCalledWith(CommitOverlayComponent);
        });
        it('should open the uploadChangesOverlay', function() {
            component.showUploadChangesOverlay();
            expect(matDialogStub.open).toHaveBeenCalledWith(UploadChangesOverlayComponent);
        });
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
    it('should call showUploadChangesOverlay when the upload changes button is clicked', function() {
        spyOn(component, 'showUploadChangesOverlay');
        const button = (element.queryAll(By.css('button.upload-circle-button'))[0]);
        button.nativeElement.click();
        expect(component.showUploadChangesOverlay).toHaveBeenCalledWith();
    });
    it('should call showCreateBranchOverlay when the create branch button is clicked', function() {
        spyOn(component, 'showCreateBranchOverlay');
        const button = (element.queryAll(By.css('button.btn-warning'))[0]);
        button.nativeElement.click();
        expect(component.showCreateBranchOverlay).toHaveBeenCalledWith();
    });
    it('should set the correct state when the merge button is clicked', function() {
        const button = (element.queryAll(By.css('button.btn-success'))[0]);
        button.nativeElement.click();
        expect(ontologyStateStub.listItem.merge.active).toEqual(true);
    });
    it('should call showCommitOverlay when the commit button is clicked', function() {
        spyOn(component, 'showCommitOverlay');
        const button = (element.queryAll(By.css('button.btn-info'))[0]);
        button.nativeElement.click();
        expect(component.showCommitOverlay).toHaveBeenCalledWith();
    });
    it('should call showCreateEntityOverlay when the create entity button is clicked', function() {
        spyOn(component, 'showCreateEntityOverlay');
        const button = (element.queryAll(By.css('button[color="primary"]'))[0]);
        button.nativeElement.click();
        expect(component.showCreateEntityOverlay).toHaveBeenCalledWith();
    });
});
