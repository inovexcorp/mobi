/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { SparqlManagerService } from '../../services/sparqlManager.service';
import { DownloadQueryOverlayComponent } from './downloadQueryOverlay.component';
import { OntologyManagerService } from '../../services/ontologyManager.service';

describe('Download Query Overlay component', function() {
    let component: DownloadQueryOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<DownloadQueryOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<DownloadQueryOverlayComponent>>;
    let sparqlManagerStub: jasmine.SpyObj<SparqlManagerService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;

    const error = 'error';
    let data;

    beforeEach(async () => {
        data = {
            query: 'SELECT * WHERE {?s ?p ?o}',
            recordId: 'recordId',
            queryType: 'select',
            isOntology: false
        };
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatFormFieldModule,
                MatSelectModule,
                MatInputModule,
                MatButtonModule,
                MatIconModule,
                MatDialogModule
            ],
            declarations: [
                DownloadQueryOverlayComponent,
            ],
            providers: [
                MockProvider(SparqlManagerService),
                MockProvider(OntologyManagerService),
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(DownloadQueryOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<DownloadQueryOverlayComponent>>;
        sparqlManagerStub = TestBed.inject(SparqlManagerService) as jasmine.SpyObj<SparqlManagerService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;

        component.data.queryType = 'select';
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        sparqlManagerStub = null;
        ontologyManagerStub = null;
    });

    describe('should initialize correctly if the query type is', function() {
        it('select', function() {
            component.ngOnInit();
            expect(component.queryType).toEqual('select');
            expect(component.downloadResultsForm.controls.fileType.value).toEqual('csv');
            expect(component.availableOptions).toEqual([
                jasmine.objectContaining({id: 'csv'}),
                jasmine.objectContaining({id: 'tsv'}),
                jasmine.objectContaining({id: 'xlsx'}),
                jasmine.objectContaining({id: 'xls'}),
            ]);
        });
        it('construct', function() {
            component.data.queryType = 'construct';
            component.ngOnInit();
            expect(component.queryType).toEqual('construct');
            expect(component.downloadResultsForm.controls.fileType.value).toEqual('ttl');
            expect(component.availableOptions).toEqual([
                jasmine.objectContaining({id: 'ttl'}),
                jasmine.objectContaining({id: 'rdf'}),
                jasmine.objectContaining({id: 'jsonld'}),
            ]);
        });
        it('not set', function() {
            delete component.data.queryType;
            component.ngOnInit();
            expect(component.queryType).toEqual('select');
            expect(component.downloadResultsForm.controls.fileType.value).toEqual('csv');
            expect(component.availableOptions).toEqual([
                jasmine.objectContaining({id: 'csv'}),
                jasmine.objectContaining({id: 'tsv'}),
                jasmine.objectContaining({id: 'xlsx'}),
                jasmine.objectContaining({id: 'xls'}),
            ]);
        });
    });
    describe('controller methods', function() {
        describe('should download the results of a query', function() {
            beforeEach(() => {
                component.downloadResultsForm.controls.fileName.setValue('name');
                component.downloadResultsForm.controls.fileType.setValue('csv');
            });
            describe('when it is not an ontology', function() {
                it('unless an error occurs', fakeAsync(function() {
                    sparqlManagerStub.downloadResultsPost.and.returnValue(throwError(error));
                    component.download();
                    tick();
                    expect(sparqlManagerStub.downloadResultsPost).toHaveBeenCalledWith(data.query, 'csv', 'name', data.recordId);
                    expect(matDialogRef.close).toHaveBeenCalledWith(error);
                }));
                it('successfully', fakeAsync(function() {
                    sparqlManagerStub.downloadResultsPost.and.returnValue(of(null));
                    component.download();
                    tick();
                    expect(sparqlManagerStub.downloadResultsPost).toHaveBeenCalledWith(data.query,'csv', 'name', data.recordId);
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                }));
            });
            describe('when it is not ontology', function() {
                beforeEach(() => {
                    data.isOntology = true;
                    data.commitId = 'commitId';
                });
                it('unless an error occurs', fakeAsync(function() {
                    ontologyManagerStub.downloadResultsPost.and.returnValue(throwError(error));
                    component.download();
                    tick();
                    expect(ontologyManagerStub.downloadResultsPost).toHaveBeenCalledWith(data.query, 'csv', 'name', data.recordId, data.commitId);
                    expect(matDialogRef.close).toHaveBeenCalledWith(error);
                }));
                it('successfully', fakeAsync(function() {
                    ontologyManagerStub.downloadResultsPost.and.returnValue(of(null));
                    component.download();
                    tick();
                    expect(ontologyManagerStub.downloadResultsPost).toHaveBeenCalledWith(data.query,'csv', 'name', data.recordId, data.commitId);
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                }));
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['input[name="fileName"]', 'mat-select'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
        it('with mat-form-fields', function() {
            expect(element.queryAll(By.css('mat-form-field')).length).toBe(2);
        });
        it('depending on the validity of the form', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();
            
            component.downloadResultsForm.controls.fileName.setValue('');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call cancel when the button is clicked', function() {
        const button = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        button.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call download when the button is clicked', function() {
        component.ngOnInit();
        spyOn(component, 'download');
        const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        button.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.download).toHaveBeenCalledWith();
    });
});
