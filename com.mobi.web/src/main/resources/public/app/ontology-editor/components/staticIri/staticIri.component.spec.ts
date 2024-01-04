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
import { DebugElement, SimpleChange } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockPipe, MockDirective, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { EditIriOverlayComponent } from '../../../shared/components/editIriOverlay/editIriOverlay.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { CopyClipboardDirective } from '../../../shared/directives/copyClipboard/copyClipboard.directive';
import { HighlightTextPipe } from '../../../shared/pipes/highlightText.pipe';
import { TrustedHtmlPipe } from '../../../shared/pipes/trustedHtml.pipe';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { StaticIriComponent } from './staticIri.component';

describe('Static IRI component', function() {
    let component: StaticIriComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<StaticIriComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let matDialog: jasmine.SpyObj<MatDialog>;

    const iri = 'http://test.com#wow';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                ReactiveFormsModule,
                FormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule,
                MatPaginatorModule,
                MatMenuModule,
                MatDividerModule
            ],
            declarations: [
                StaticIriComponent,
                MockComponent(EditIriOverlayComponent),
                MockComponent(ErrorDisplayComponent),
                MockPipe(HighlightTextPipe),
                MockDirective(CopyClipboardDirective),
                MockPipe(TrustedHtmlPipe)
            ],
            providers: [
                MockProvider(OntologyStateService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                }) }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(StaticIriComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        matDialog = null;
    });

    it('should initialize correctly', function() {
        spyOn(component, 'setVariables');
        component.ngOnInit();
        expect(component.setVariables).toHaveBeenCalledWith();
    });
    it('should handle changes to the iri', function() {
        const spy = spyOn(component, 'setVariables');
        let change = new SimpleChange('', iri, true);
        component.ngOnChanges({iri: change});
        expect(component.setVariables).not.toHaveBeenCalled();

        change = new SimpleChange('', iri, false);
        component.ngOnChanges({iri: change});
        expect(component.setVariables).toHaveBeenCalledWith();

        spy.calls.reset();
        component.ngOnChanges({});
        expect(component.setVariables).toHaveBeenCalledWith();
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.static-iri')).length).toEqual(1);
        });
        it('depending on whether the IRI is imported', function() {
            ontologyStateStub.canModify.and.returnValue(true);
            component.readOnly = false;
            fixture.detectChanges();
            expect(element.queryAll(By.css('a')).length).toEqual(1);

            ontologyStateStub.isSelectedImported.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('a')).length).toEqual(0);
        });
        it('depending on whether the user cannot modify', function() {
            ontologyStateStub.canModify.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('a')).length).toEqual(0);
        });
        describe('depending on whether the IRI', function() {
            beforeEach(function() {
                this.strong = element.queryAll(By.css('strong'))[0];
            });
            describe('exists in the ontology and duplicateCheck is', function() {
                beforeEach(function() {
                    ontologyStateStub.checkIri.and.returnValue(true);
                });
                it('true', function() {
                    component.duplicateCheck = true;
                    fixture.detectChanges();
                    const errorDisplay = element.queryAll(By.css('error-display'));
                    expect(errorDisplay.length).toEqual(1);
                    expect(errorDisplay[0].nativeElement.textContent.trim()).toEqual('This IRI already exists');
                    expect(this.strong.classes['duplicate-iri']).toBeTruthy();
                });
                it('false', function() {
                    component.duplicateCheck = false;
                    fixture.detectChanges();
                    expect(element.queryAll(By.css('error-display')).length).toEqual(0);
                    expect(this.strong.classes['duplicate-iri']).toBeFalsy();
                });
            });
            it('does not exist in the ontology', function() {
                ontologyStateStub.checkIri.and.returnValue(false);
                fixture.detectChanges();

                expect(element.queryAll(By.css('error-display')).length).toEqual(0);
                expect(this.strong.classes['duplicate-iri']).toBeFalsy();
            });
            it('is read only', function() {
                ontologyStateStub.canModify.and.returnValue(true);
                component.readOnly = true;
                fixture.detectChanges();
                expect(element.queryAll(By.css('a')).length).toEqual(0);
            });
        });
    });
    describe('controller methods', function() {
        it('setVariables sets the parts of the IRI', function() {
            component.iriBegin = 'begin';
            component.iriThen = 'then';
            component.iriEnd = 'end';
            component.iri = iri;
            component.setVariables();
            expect(component.iriBegin).toEqual('http://test.com');
            expect(component.iriThen).toEqual('#');
            expect(component.iriEnd).toEqual('wow');
        });
        describe('showIriOverlay opens the editIriOverlay if duplicateCheck is', function() {
            beforeEach(function() {
                component.iriBegin = 'begin';
                component.iriThen = 'then';
                component.iriEnd = 'end';
                spyOn(component.onEdit, 'emit');
            });
            it('true', fakeAsync(function() {
                component.duplicateCheck = true;
                component.showIriOverlay();
                tick();
                expect(matDialog.open).toHaveBeenCalledWith(EditIriOverlayComponent, {
                    data: {
                        iriBegin: component.iriBegin,
                        iriThen: component.iriThen,
                        iriEnd: component.iriEnd,
                        validator: jasmine.any(Function),
                        validatorMsg: 'This IRI already exists',
                        validatorKey: 'iri'
                    }
                });
                expect(component.onEdit.emit).toHaveBeenCalledWith(true);
            }));
            it('false', fakeAsync(function() {
                component.duplicateCheck = false;
                component.showIriOverlay();
                tick();
                expect(matDialog.open).toHaveBeenCalledWith(EditIriOverlayComponent, {
                    data: {
                        iriBegin: component.iriBegin,
                        iriThen: component.iriThen,
                        iriEnd: component.iriEnd,
                    }
                });
                expect(component.onEdit.emit).toHaveBeenCalledWith(true);
            }));
        });
    });
});
