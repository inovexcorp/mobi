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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { SerializationSelectComponent } from '../../../shared/components/serializationSelect/serializationSelect.component';
import { PreviewBlockComponent } from './previewBlock.component';

describe('Preview Block component', function() {
    let component: PreviewBlockComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PreviewBlockComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatButtonModule,
                MatCardModule
             ],
            declarations: [
                PreviewBlockComponent,
                MockComponent(SerializationSelectComponent),
                MockComponent(CodemirrorComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PreviewBlockComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;

        ontologyStateStub.listItem = new OntologyListItem();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        ontologyManagerStub = null;
    });

    it('should initialize correctly', fakeAsync(function() {
        component.activePage = {serialization: 'jsonld'};
        component.ngOnInit();
        expect(component.previewForm.controls.serialization.value).toEqual('jsonld');

        spyOn(component.activePageChange, 'emit');
        component.previewForm.controls.serialization.setValue('turtle');
        tick();
        expect(component.activePage.serialization).toEqual('turtle');
        expect(component.activePageChange.emit).toHaveBeenCalledWith(component.activePage);
    }));
    it('should correctly handle changes', function() {
        component.activePage = {mode: 'text/turtle'};
        component.ngOnChanges();
        expect(component.options.mode).toEqual('text/turtle');
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            component.activePage = {};
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.preview-block')).length).toEqual(1);
        });
        ['mat-card', 'mat-card-header', 'mat-card-content', 'form', 'serialization-select'].forEach(item => {
            it(`with a .${item}`, function() {
                expect(element.queryAll(By.css(item)).length).toEqual(1);
            });
        });
        it('depending on whether a preview is generated', function() {
            expect(element.queryAll(By.css('ngx-codemirror')).length).toEqual(0);

            component.activePage = {preview: 'test'};
            fixture.detectChanges();
            expect(element.queryAll(By.css('ngx-codemirror')).length).toEqual(1);
        });
        it('depending on whether a serialization was selected', function() {
            component.activePage = {};
            fixture.detectChanges();
            const button = element.queryAll(By.css('.refresh-button'))[0];
            expect(button.properties['disabled']).toBeTruthy();

            component.activePage = {serialization: 'test'};
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('should set the preview', function() {
            beforeEach(function() {
                spyOn(component.activePageChange, 'emit');
            });
            it('unless an error occurs', fakeAsync(function() {
                component.activePage = { serialization: 'test' };
                ontologyManagerStub.postQueryResults.and.returnValue(throwError('Error'));
                component.setPreview();
                tick();
                expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.commitId, 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o . } LIMIT 5000', 'test', false, true);
                expect(component.activePage.preview).toEqual('Error');
                expect(component.activePageChange.emit).toHaveBeenCalledWith(component.activePage);
            }));
            describe('successfully', function() {
                it('if the format is JSON-LD', fakeAsync(function() {
                    const jsonld = [{'@id': 'id'}];
                    ontologyManagerStub.postQueryResults.and.returnValue(of(jsonld));
                    component.activePage = {serialization: 'jsonld'};
                    component.setPreview();
                    tick();
                    expect(component.activePage.mode).toEqual('application/ld+json');
                    expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.commitId, 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o . } LIMIT 5000', 'jsonld', false, true);
                    expect(component.activePage.preview).toEqual(JSON.stringify(jsonld, null, 2));
                    expect(component.activePageChange.emit).toHaveBeenCalledWith(component.activePage);
                }));
                it('if the format is not JSON-LD', fakeAsync(function() {
                    [
                        {
                            serialization: 'turtle',
                            mode: 'text/turtle'
                        },
                        {
                            serialization: 'rdf/xml',
                            mode: 'application/xml'
                        }
                    ].forEach(test => {
                        ontologyManagerStub.postQueryResults.and.returnValue(of('Test'));
                        component.activePage = {serialization: test.serialization};
                        component.setPreview();
                        tick();
                        expect(component.activePage.mode).toEqual(test.mode);
                        expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.commitId, 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o . } LIMIT 5000', test.serialization, false, true);
                        expect(component.activePage.preview).toEqual('Test');
                        expect(component.activePageChange.emit).toHaveBeenCalledWith(component.activePage);
                    });
                }));
            });
        });
    });
    it('should call getPreview when the button is clicked', function() {
        spyOn(component, 'setPreview');
        const button = element.queryAll(By.css('button.refresh-button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.setPreview).toHaveBeenCalledWith();
    });
});
