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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider, MockPipe } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { PrefixationPipe } from '../../../shared/pipes/prefixation.pipe';
import { ManchesterConverterService } from '../../../shared/services/manchesterConverter.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { IndividualTypesModalComponent } from '../individualTypesModal/individualTypesModal.component';
import { StaticIriComponent } from '../staticIri/staticIri.component';
import { SelectedDetailsComponent } from './selectedDetails.component';

describe('Selected Details component', function() {
    let component: SelectedDetailsComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SelectedDetailsComponent>;
    let prefixationStub: jasmine.SpyObj<PrefixationPipe>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let manchesterConverterStub: jasmine.SpyObj<ManchesterConverterService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const iri = 'iri';
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatDialogModule,
            ],
            declarations: [
                SelectedDetailsComponent,
                MockComponent(StaticIriComponent),
                MockComponent(IndividualTypesModalComponent)
            ],
            providers: [
                MockProvider(OntologyManagerService),
                MockProvider(OntologyStateService),
                { provide: PrefixationPipe, useClass: MockPipe(PrefixationPipe) },
                MockProvider(ManchesterConverterService),
                MockProvider(ToastService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                }) }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SelectedDetailsComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        prefixationStub = TestBed.inject(PrefixationPipe) as jasmine.SpyObj<PrefixationPipe>;
        manchesterConverterStub = TestBed.inject(ManchesterConverterService) as jasmine.SpyObj<ManchesterConverterService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = { '@id': iri };
        ontologyStateStub.canModify.and.returnValue(true);
        prefixationStub.transform.and.callFake(a => a);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        matDialog = null;
        ontologyManagerStub = null;
        manchesterConverterStub = null;
        toastStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.selected-details')).length).toEqual(1);
        });
        it('depending on whether something is selected', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-heading')).length).toEqual(1);
            expect(element.queryAll(By.css('static-iri')).length).toEqual(1);

            ontologyStateStub.listItem.selected = undefined;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-heading')).length).toEqual(0);
            expect(element.queryAll(By.css('static-iri')).length).toEqual(0);
        });
        it('depending on whether the selected entity has types', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.type-wrapper')).length).toEqual(0);

            ontologyStateStub.listItem.selected['@type'] = ['test'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.type-wrapper')).length).toEqual(1);
        });
        it('depending on whether the details should be read only', function() {
            ontologyManagerStub.isIndividual.and.returnValue(true);
            ontologyStateStub.listItem.selected['@type'] = ['test'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('static-iri')).length).toEqual(1);
            expect(element.queryAll(By.css('a')).length).toEqual(1);

            component.readOnly = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('static-iri')).length).toEqual(1);
            expect(element.queryAll(By.css('a')).length).toEqual(0);
        });
        it('depending on whether the entity is an individual', function() {
            ontologyManagerStub.isIndividual.and.returnValue(false);
            ontologyStateStub.listItem.selected['@type'] = ['test'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('a')).length).toEqual(0);

            ontologyManagerStub.isIndividual.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('a')).length).toEqual(1);
        });
        it('when selected imported is true', function() {
            ontologyStateStub.listItem.entityInfo = {
                [iri]: { label: '', names: [], imported: true, ontologyId: 'ont1' }
            };
            expect(component.isFromImportedOntology()).toEqual(true);
            expect(component.getImportedOntology()).toEqual('ont1');
            fixture.detectChanges();
            expect(element.queryAll(By.css('.is-imported-ontology')).length).toEqual(1);
            expect(element.queryAll(By.css('.imported-ontology'))[0].nativeElement.textContent.trim()).toEqual('ont1');
            
            ontologyStateStub.listItem.entityInfo = {
                [iri]: { label: '', names: [], imported: false, ontologyId: 'ont1' }
            };
            fixture.detectChanges();
            expect(element.queryAll(By.css('.is-imported-ontology')).length).toEqual(0);
        });
    });
    describe('controller methods', function() {
        describe('isFromImportedOntology functions properly', function() {
            it('when selected is empty', function() {
                ontologyStateStub.listItem.selected = undefined;
                expect(component.isFromImportedOntology()).toEqual(false);
            });
            it('when selected imported is false', function() {
                ontologyStateStub.listItem.entityInfo = {
                    [iri]: { label: '', names: [], imported: false }
                };
                expect(component.isFromImportedOntology()).toEqual(false);
            });
            it('when selected imported is false and entityInfo empty', function() {
                ontologyStateStub.listItem.entityInfo = {
                    [iri]: { label: '', names: [] }
                };
                expect(component.isFromImportedOntology()).toEqual(false);
            });
            it('when selected imported is true', function() {
                ontologyStateStub.listItem.entityInfo = {
                    [iri]: { label: '', names: [], imported: true }
                };
                expect(component.isFromImportedOntology()).toEqual(true);
            });
        });
        describe('getImportedOntology functions properly', function() {
            it('when selected is empty', function() {
                ontologyStateStub.listItem.selected = undefined;
                expect(component.getImportedOntology()).toEqual('');
            });
            it('when selected and entityInfo is correct', function() {
                ontologyStateStub.listItem.entityInfo = {
                    [iri]: { label: '', names: [], imported: false, ontologyId: 'ont1'},
                };
                expect(component.getImportedOntology()).toEqual('ont1');
            });
            it('when selected and entityInfo is empty', function() {
                ontologyStateStub.listItem.entityInfo = {
                    [iri]: { label: '', names: [], imported: false}
                };
                expect(component.getImportedOntology()).toEqual('');
            });
        });
        describe('getTypes functions properly', function() {
            it('when @type is empty', function() {
                ontologyStateStub.listItem.selected = undefined;
                expect(component.getTypes()).toEqual('');
            });
            it('when @type has items', function() {
                ontologyStateStub.listItem.selected['@type'] = ['test', 'test2'];
                expect(component.getTypes()).toEqual('test, test2');
            });
            it('when @type has blank node items', function() {
                ontologyStateStub.listItem.selectedBlankNodes = [];
                ontologyStateStub.getBnodeIndex.and.returnValue({});
                ontologyStateStub.listItem.selected['@type'] = ['_:genid0', 'test2'];
                manchesterConverterStub.jsonldToManchester.and.callFake(a => a);
                expect(component.getTypes()).toEqual('_:genid0, test2');
                expect(manchesterConverterStub.jsonldToManchester).toHaveBeenCalledWith('_:genid0', ontologyStateStub.listItem.selectedBlankNodes, {}, true);
                expect(ontologyStateStub.getBnodeIndex).toHaveBeenCalledWith();
            });
        });
        describe('onEdit calls the proper functions', function() {
            beforeEach(function() {
                ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
            });
            it('when ontologyState.onEdit resolves', fakeAsync(function() {
                ontologyStateStub.onEdit.and.returnValue(of(null));
                component.onEdit('begin', 'middle', 'end');
                tick();
                expect(ontologyStateStub.onEdit).toHaveBeenCalledWith('begin', 'middle', 'end');
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(ontologyStateStub.updateLabel).toHaveBeenCalledWith();
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('when ontologyState.onEdit rejects', fakeAsync(function() {
                ontologyStateStub.onEdit.and.returnValue(throwError('error'));
                component.onEdit('begin', 'middle', 'end');
                tick();
                expect(ontologyStateStub.onEdit).toHaveBeenCalledWith('begin', 'middle', 'end');
                expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(ontologyStateStub.updateLabel).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('error');
            }));
        });
        it('should open the individual types modal', function() {
            component.showTypesOverlay();
            expect(matDialog.open).toHaveBeenCalledWith(IndividualTypesModalComponent);
        });
    });
});
