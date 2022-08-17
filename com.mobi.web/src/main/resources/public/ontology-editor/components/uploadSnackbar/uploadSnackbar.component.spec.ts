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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule, MatDialog, MatDialogModule, MatIconModule, MatProgressSpinnerModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, Subject } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { OntologyUploadItem } from '../../../shared/models/ontologyUploadItem.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { UploadErrorsOverlayComponent } from '../uploadErrorsOverlay/uploadErrorsOverlay.component';
import { UploadSnackbarComponent } from './uploadSnackbar.component';

describe('Upload Snackbar component', function() {
    let component: UploadSnackbarComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UploadSnackbarComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let matDialog: jasmine.SpyObj<MatDialog>;

    let item: OntologyUploadItem;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule,
                MatProgressSpinnerModule
            ],
            declarations: [
                UploadSnackbarComponent,
                MockComponent(ConfirmModalComponent),
                MockComponent(UploadErrorsOverlayComponent)
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
        fixture = TestBed.createComponent(UploadSnackbarComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);
        matDialog = TestBed.get(MatDialog);

        item = {
            id: '',
            title: '',
            sub: of(null).subscribe(),
            status: undefined,
            error: undefined
        };
        ontologyStateStub.uploadList = [];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        matDialog = null;
        item = null;
    });

    it('should handle the component being destroyed', function() {
        spyOn(component, 'close');
        component.ngOnDestroy();
        expect(component.close).toHaveBeenCalledWith();
    });
    describe('controller methods', function() {
        describe('attemptClose should call the appropriate method if', function() {
            beforeEach(function() {
                spyOn(component, 'close');
            });
            it('there are pending uploads', fakeAsync(function() {
                ontologyStateStub.uploadPending = 1;
                component.attemptClose();
                tick();
                expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringContaining('Are you sure')}});
                expect(component.close).toHaveBeenCalledWith();
            }));
            it('all uploads are complete', function() {
                ontologyStateStub.uploadPending = 0;
                component.attemptClose();
                expect(matDialog.open).not.toHaveBeenCalled();
                expect(component.close).toHaveBeenCalledWith();
            });
        });
        it('close should set and call correct things', function() {
            ontologyStateStub.uploadList = [item];
            ontologyStateStub.uploadFiles = [new File([], '')];
            spyOn(component.closeEvent, 'emit');
            component.close();
            expect(component.closeEvent.emit).toHaveBeenCalledWith();
            expect(item.sub.closed).toBeTrue();
            expect(ontologyStateStub.uploadList).toEqual([]);
            expect(ontologyStateStub.uploadFiles).toEqual([]);
            expect(ontologyStateStub.uploadPending).toEqual(0);
        });
        it('should get the title for the snackbar', function() {
            ontologyStateStub.uploadList = [item];
            
            ontologyStateStub.uploadPending = 5;
            expect(component.getTitle()).toEqual('Uploading 5 items');
            
            ontologyStateStub.uploadPending = 1;
            expect(component.getTitle()).toEqual('Uploading 1 item');

            ontologyStateStub.uploadPending = 0;
            expect(component.getTitle()).toEqual('1 upload(s) complete');
        });
        it('should open the UploadErrorsOverlay', function() {
            component.showUploadErrorsOverlay(item);
            expect(matDialog.open).toHaveBeenCalledWith(UploadErrorsOverlayComponent, { data: { item }});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.upload-snackbar')).length).toEqual(1);
        });
        ['.snackbar-header', '.snackbar-body'].forEach(function(item) {
            it('with a ' + item, function() {
                expect(element.queryAll(By.css(item)).length).toEqual(1);
            });
        });
        it('with buttons', function() {
            expect(element.queryAll(By.css('.snackbar-header button')).length).toEqual(2);
        });
        it('depending on whether the snackbar body should be collapsed', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('.snackbar-header button.collapse-button'))[0];
            const body = element.queryAll(By.css('.snackbar-body'))[0];
            expect(button.nativeElement.textContent.trim()).toEqual('keyboard_arrow_up');
            expect(body.nativeElement.hasAttribute('hidden')).toBeFalse();

            component.collapse = true;
            fixture.detectChanges();
            expect(button.nativeElement.textContent.trim()).toEqual('keyboard_arrow_down');
            expect(body.nativeElement.hasAttribute('hidden')).toBeTrue();
        });
        it('depending on how many ontologies are being uploaded', function() {
            const item: OntologyUploadItem = {
                id: '',
                title: '',
                status: of('processing'),
                sub: of(null).subscribe(),
                error: undefined
            };
            ontologyStateStub.uploadList = [item];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.uploaded-ontology')).length).toEqual(1);
        });
        it('depending on the status', function() {
            const _statusSubject = new Subject<string>();
            const item: OntologyUploadItem = {
                id: '',
                title: '',
                status: _statusSubject.asObservable(),
                sub: of(null).subscribe(),
                error: undefined
            };
            ontologyStateStub.uploadList = [item];
            fixture.detectChanges();
            _statusSubject.next('processing');
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-spinner')).length).toEqual(1);
            expect(element.queryAll(By.css('.item-completed')).length).toEqual(0);

            _statusSubject.next('complete');
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-spinner')).length).toEqual(0);
            expect(element.queryAll(By.css('.item-completed')).length).toEqual(1);
            expect(element.queryAll(By.css('.item-completed i.fa-check.text-success')).length).toEqual(1);

            _statusSubject.next('error');
            item.error = {
                error: '',
                errorDetails: [],
                errorMessage: 'message'
            };
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-spinner')).length).toEqual(0);
            expect(element.queryAll(By.css('.item-completed')).length).toEqual(1);
            expect(element.queryAll(By.css('.item-completed i.fa-times.text-danger')).length).toEqual(1);
        });
        it('depending on whether the item has an error', function() {
            const item: OntologyUploadItem = {
                id: '',
                title: '',
                status: of('error'),
                sub: of(null).subscribe(),
                error: {
                    error: '',
                    errorDetails: [],
                    errorMessage: ''
                }
            };
            ontologyStateStub.uploadList = [item];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.item-details p.text-danger')).length).toEqual(1);
            expect(element.queryAll(By.css('.item-details a')).length).toEqual(0);

            item.error.errorDetails = ['Detail 1'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.item-details p.text-danger')).length).toEqual(1);
            expect(element.queryAll(By.css('.item-details a')).length).toEqual(1);
        });
    });
});