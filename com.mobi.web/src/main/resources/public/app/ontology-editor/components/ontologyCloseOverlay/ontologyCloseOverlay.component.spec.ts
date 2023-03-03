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
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { Difference } from '../../../shared/models/difference.class';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyCloseOverlayComponent } from './ontologyCloseOverlay.component';

describe('Ontology Close Overlay component', function() {
    let component: OntologyCloseOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OntologyCloseOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<OntologyCloseOverlayComponent>>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    const listItem = new OntologyListItem();
    listItem.versionedRdfRecord.recordId = 'recordId';
    listItem.additions = [{'@id': 'add'}];
    listItem.deletions = [{'@id': 'del'}];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                OntologyCloseOverlayComponent,
                MockComponent(ErrorDisplayComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                { provide: MAT_DIALOG_DATA, useValue: { listItem } },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(OntologyCloseOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<OntologyCloseOverlayComponent>>;

        ontologyStateStub.listItem = listItem;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        ontologyStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with a .main', function() {
            expect(element.queryAll(By.css('.main')).length).toEqual(1);
        });
        it('depending on whether an error occurred', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);

            component.error = 'error';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('with buttons to close, close without saving, and cancel', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(3);
            expect(['Cancel', 'Close Without Saving', 'Save and Close']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Close Without Saving', 'Save and Close']).toContain(buttons[1].nativeElement.textContent.trim());
            expect(['Cancel', 'Close Without Saving', 'Save and Close']).toContain(buttons[2].nativeElement.textContent.trim());
        });
    });
    describe('controller methods', function() {
        describe('saveThenClose calls the correct functions', function() {
            describe('when resolved, calls the correct controller function', function() {
                beforeEach(function() {
                    ontologyStateStub.saveChanges.and.returnValue(of(null));
                    spyOn(component, 'closeModal');
                });
                it('when afterSave is resolved', fakeAsync(function() {
                    const expectedDiff = new Difference();
                    expectedDiff.additions = listItem.additions;
                    expectedDiff.deletions = listItem.deletions;
                    ontologyStateStub.afterSave.and.returnValue(of(null));
                    component.saveThenClose();
                    tick();
                    expect(ontologyStateStub.saveChanges).toHaveBeenCalledWith(listItem.versionedRdfRecord.recordId, expectedDiff);
                    expect(component.closeModal).toHaveBeenCalledWith();
                    expect(ontologyStateStub.afterSave).toHaveBeenCalledWith(ontologyStateStub.listItem);
                }));
                it('when afterSave is rejected', fakeAsync(function() {
                    ontologyStateStub.afterSave.and.returnValue(throwError('error'));
                    component.saveThenClose();
                    tick();
                    expect(component.closeModal).not.toHaveBeenCalled();
                    expect(ontologyStateStub.afterSave).toHaveBeenCalledWith(ontologyStateStub.listItem);
                    expect(component.error).toEqual('error');
                }));
            });
            it('when rejected, sets the correct variable', fakeAsync(function() {
                ontologyStateStub.saveChanges.and.returnValue(throwError('error'));
                component.saveThenClose();
                tick();
                expect(component.error).toEqual('error');
            }));
        });
        it('closeModal calls the correct manager functions and sets the correct manager variable', function() {
            component.closeModal();
            expect(ontologyStateStub.closeOntology).toHaveBeenCalledWith(listItem.versionedRdfRecord.recordId);
            expect(matDialogRef.close).toHaveBeenCalledWith();
        });
    });
    it('should call saveThenClose when the button is clicked', function() {
        spyOn(component, 'saveThenClose');
        const button = element.queryAll(By.css('.mat-dialog-actions button.save-close-btn'))[0];
        button.triggerEventHandler('click', null);
        expect(component.saveThenClose).toHaveBeenCalledWith();
    });
    it('should call saveThenClose when the button is clicked', function() {
        spyOn(component, 'closeModal');
        const button = element.queryAll(By.css('.mat-dialog-actions button.close-btn'))[0];
        button.triggerEventHandler('click', null);
        expect(component.closeModal).toHaveBeenCalledWith();
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
});
