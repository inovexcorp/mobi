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
import { MatDialogRef, MatDialogModule, MatButtonModule, MatIconModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { some } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OWL } from '../../../prefixes';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyClassSelectComponent } from '../ontologyClassSelect/ontologyClassSelect.component';
import { IndividualTypesModalComponent } from './individualTypesModal.component';

describe('Individual Types Modal component', function() {
    let component: IndividualTypesModalComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<IndividualTypesModalComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<IndividualTypesModalComponent>>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;

    const error = 'Error Message';
    const iri = 'iri';

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                IndividualTypesModalComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(OntologyClassSelectComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(IndividualTypesModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);
        ontologyManagerStub = TestBed.get(OntologyManagerService);
        matDialogRef = TestBed.get(MatDialogRef);

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = {'@id': iri, '@type': [OWL + 'NamedIndividual', 'type1', 'type2'], 'title': [{'@value': 'title'}]};
        ontologyStateStub.listItem.classesAndIndividuals = {'type1': [iri], 'type2': [iri]};
        ontologyStateStub.listItem.classesWithIndividuals = ['type1', 'type2'];
        ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        ontologyStateStub = null;
        ontologyManagerStub = null;
    });

    it('should initialize correctly', function() {
        ontologyManagerStub.getEntityName.and.returnValue('name');
        component.ngOnInit();
        expect(component.entityName).toEqual('name');
        expect(component.types).toEqual([OWL + 'NamedIndividual', 'type1', 'type2']);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with an ontology-class-select', function() {
            expect(element.queryAll(By.css('ontology-class-select')).length).toEqual(1);
        });
        it('depending on whether an error occurred', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);

            component.error = error;
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    describe('controller methods', function() {
        describe('should update the individual types', function() {
            beforeEach(function() {
                component.types = Object.assign([], ontologyStateStub.listItem.selected['@type']);
                ontologyStateStub.getIndividualsParentPath.and.returnValue(['type1']);
                this.typeNode = {
                    entityIRI: 'type1',
                    hasChildren: false,
                    indent: 0,
                    path: [],
                    entityInfo: undefined,
                    joinedPath: '',
                };
                ontologyStateStub.createFlatIndividualTree.and.returnValue([this.typeNode]);
                this.node = {
                    entityIRI: iri,
                    hasChildren: false,
                    indent: 0,
                    path: [],
                    entityInfo: undefined,
                    joinedPath: '',
                };
                ontologyStateStub.flattenHierarchy.and.returnValue([this.node]);
                ontologyStateStub.containsDerivedConcept.and.callFake(arr => some(arr, iri => iri.includes('concept')));
                ontologyStateStub.containsDerivedConceptScheme.and.callFake(arr => some(arr, iri => iri.includes('scheme')));
                ontologyStateStub.listItem.classes.iris = {
                    'new': '',
                    'type1': '',
                    'type2': ''
                };
            });
            it('if a type was added', function() {
                component.types.push('new');
                component.submit();
                expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1', 'type2', 'new']);
                expect(ontologyStateStub.listItem.classesAndIndividuals).toEqual({'type1': [iri], 'type2': [iri], 'new': [iri]});
                expect(ontologyStateStub.listItem.classesWithIndividuals).toEqual(['type1', 'type2', 'new']);
                expect(ontologyStateStub.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateStub.listItem);
                expect(ontologyStateStub.listItem.individualsParentPath).toEqual(['type1']);
                expect(ontologyStateStub.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateStub.listItem);
                expect(ontologyStateStub.listItem.individuals.flat).toEqual([this.typeNode]);
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {'@id': iri, '@type': ['new']});
                expect(ontologyStateStub.addToDeletions).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('if a type was removed', function() {
                component.types = [OWL + 'NamedIndividual', 'type1'];
                component.submit();
                expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1']);
                expect(ontologyStateStub.listItem.classesAndIndividuals).toEqual({'type1': [iri]});
                expect(ontologyStateStub.listItem.classesWithIndividuals).toEqual(['type1']);
                expect(ontologyStateStub.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateStub.listItem);
                expect(ontologyStateStub.listItem.individualsParentPath).toEqual(['type1']);
                expect(ontologyStateStub.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateStub.listItem);
                expect(ontologyStateStub.listItem.individuals.flat).toEqual([this.typeNode]);
                expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {'@id': iri, '@type': ['type2']});
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('if the individual is now a concept', function() {
                component.types.push('concept');
                component.submit();
                expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1', 'type2', 'concept']);
                expect(ontologyStateStub.addConcept).toHaveBeenCalledWith(ontologyStateStub.listItem.selected);
                expect(ontologyStateStub.updateVocabularyHierarchies).not.toHaveBeenCalledWith('@id', jasmine.anything());
                expect(ontologyStateStub.updateVocabularyHierarchies).not.toHaveBeenCalledWith('@type', jasmine.anything());
                expect(ontologyStateStub.updateVocabularyHierarchies).toHaveBeenCalledWith('title', [{'@value': 'title'}]);
            });
            describe('if the individual is no longer a concept', function() {
                beforeEach(function() {
                    ontologyStateStub.listItem.selected['@type'] = [OWL + 'NamedIndividual', 'type1', 'concept'];
                    component.types = [OWL + 'NamedIndividual', 'type1'];
                    ontologyStateStub.listItem.concepts.flat = [this.node];
                    ontologyStateStub.listItem.concepts.iris = {[iri]: ''};
                    ontologyStateStub.listItem.conceptSchemes.flat = [this.node];
                    ontologyStateStub.flattenHierarchy.and.returnValue([]);
                });
                describe('and the individual is selected in the concepts page', function() {
                    beforeEach(function() {
                        ontologyStateStub.listItem.editorTabStates.concepts = {
                            entityIRI: iri,
                            usages: {},
                        };
                    });
                    it('and the concepts page is active', function() {
                        ontologyStateStub.getActiveKey.and.returnValue('concepts');
                        component.submit();
                        expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1']);
                        expect(ontologyStateStub.listItem.concepts.iris).toEqual({});
                        expect(ontologyStateStub.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.concepts, iri);
                        expect(ontologyStateStub.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.conceptSchemes, iri);
                        expect(ontologyStateStub.listItem.concepts.flat).toEqual([]);
                        expect(ontologyStateStub.listItem.conceptSchemes.flat).toEqual([]);
                        expect(ontologyStateStub.listItem.editorTabStates.concepts).toEqual({});
                        expect(ontologyStateStub.unSelectItem).toHaveBeenCalledWith();
                    });
                    it('and the concepts page is not active', function() {
                        component.submit();
                        expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1']);
                        expect(ontologyStateStub.listItem.concepts.iris).toEqual({});
                        expect(ontologyStateStub.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.concepts, iri);
                        expect(ontologyStateStub.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.conceptSchemes, iri);
                        expect(ontologyStateStub.listItem.concepts.flat).toEqual([]);
                        expect(ontologyStateStub.listItem.conceptSchemes.flat).toEqual([]);
                        expect(ontologyStateStub.listItem.editorTabStates.concepts).toEqual({});
                        expect(ontologyStateStub.unSelectItem).not.toHaveBeenCalled();
                    });
                });
                describe('and the individual is selected in the schemes page', function() {
                    beforeEach(function() {
                        ontologyStateStub.listItem.editorTabStates.schemes = {
                            entityIRI: iri,
                            usages: {},
                        };
                    });
                    it('and the schemes page is active', function() {
                        ontologyStateStub.getActiveKey.and.returnValue('schemes');
                        component.submit();
                        expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1']);
                        expect(ontologyStateStub.listItem.concepts.iris).toEqual({});
                        expect(ontologyStateStub.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.concepts, iri);
                        expect(ontologyStateStub.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.conceptSchemes, iri);
                        expect(ontologyStateStub.listItem.concepts.flat).toEqual([]);
                        expect(ontologyStateStub.listItem.conceptSchemes.flat).toEqual([]);
                        expect(ontologyStateStub.listItem.editorTabStates.schemes).toEqual({});
                        expect(ontologyStateStub.unSelectItem).toHaveBeenCalledWith();
                    });
                    it('and the schemes page is not active', function() {
                        component.submit();
                        expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1']);
                        expect(ontologyStateStub.listItem.concepts.iris).toEqual({});
                        expect(ontologyStateStub.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.concepts, iri);
                        expect(ontologyStateStub.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.conceptSchemes, iri);
                        expect(ontologyStateStub.listItem.concepts.flat).toEqual([]);
                        expect(ontologyStateStub.listItem.conceptSchemes.flat).toEqual([]);
                        expect(ontologyStateStub.listItem.editorTabStates.schemes).toEqual({});
                        expect(ontologyStateStub.unSelectItem).not.toHaveBeenCalled();
                    });
                });
                it('and is not selected elsewhere', function() {
                    component.submit();
                    expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1']);
                    expect(ontologyStateStub.listItem.concepts.iris).toEqual({});
                    expect(ontologyStateStub.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.concepts, iri);
                    expect(ontologyStateStub.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.conceptSchemes, iri);
                    expect(ontologyStateStub.listItem.concepts.flat).toEqual([]);
                    expect(ontologyStateStub.listItem.conceptSchemes.flat).toEqual([]);
                    expect(ontologyStateStub.unSelectItem).not.toHaveBeenCalled();
                });
            });
            it('if the individual is now a concept scheme', function() {
                component.types.push('scheme');
                component.submit();
                expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1', 'type2', 'scheme']);
                expect(ontologyStateStub.addConceptScheme).toHaveBeenCalledWith(ontologyStateStub.listItem.selected);
                expect(ontologyStateStub.updateVocabularyHierarchies).not.toHaveBeenCalledWith('@id', jasmine.anything());
                expect(ontologyStateStub.updateVocabularyHierarchies).not.toHaveBeenCalledWith('@type', jasmine.anything());
                expect(ontologyStateStub.updateVocabularyHierarchies).toHaveBeenCalledWith('title', [{'@value': 'title'}]);
            });
            describe('if the individual is no longer a scheme', function() {
                beforeEach(function() {
                    ontologyStateStub.listItem.selected['@type'] = [OWL + 'NamedIndividual', 'type1', 'scheme'];
                    component.types = [OWL + 'NamedIndividual', 'type1'];
                    ontologyStateStub.listItem.conceptSchemes.flat = [this.node];
                    ontologyStateStub.listItem.concepts.iris = {[iri]: ''};
                    ontologyStateStub.flattenHierarchy.and.returnValue([]);
                });
                describe('and the individual is selected in the schemes page', function() {
                    beforeEach(function() {
                        ontologyStateStub.listItem.editorTabStates.schemes = {
                            entityIRI: iri,
                            usages: {},
                        };
                    });
                    it('and the schemes page is active', function() {
                        ontologyStateStub.getActiveKey.and.returnValue('schemes');
                        component.submit();
                        expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1']);
                        expect(ontologyStateStub.listItem.conceptSchemes.iris).toEqual({});
                        expect(ontologyStateStub.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.conceptSchemes, iri);
                        expect(ontologyStateStub.listItem.conceptSchemes.flat).toEqual([]);
                        expect(ontologyStateStub.listItem.editorTabStates.schemes).toEqual({});
                        expect(ontologyStateStub.unSelectItem).toHaveBeenCalledWith();
                    });
                    it('and the schemes page is not active', function() {
                        component.submit();
                        expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1']);
                        expect(ontologyStateStub.listItem.conceptSchemes.iris).toEqual({});
                        expect(ontologyStateStub.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.conceptSchemes, iri);
                        expect(ontologyStateStub.listItem.conceptSchemes.flat).toEqual([]);
                        expect(ontologyStateStub.listItem.editorTabStates.schemes).toEqual({});
                        expect(ontologyStateStub.unSelectItem).not.toHaveBeenCalled();
                    });
                });
                it('and the individual is not selected elsewhere', function() {
                    component.submit();
                    expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1']);
                    expect(ontologyStateStub.listItem.conceptSchemes.iris).toEqual({});
                    expect(ontologyStateStub.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.conceptSchemes, iri);
                    expect(ontologyStateStub.listItem.conceptSchemes.flat).toEqual([]);
                    expect(ontologyStateStub.unSelectItem).not.toHaveBeenCalled();
                });
            });
            it('unless the new types do not include any defined classes', function() {
                component.types = [OWL + 'NamedIndividual'];
                component.submit();
                expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1', 'type2']);
                expect(component.error).toBeTruthy();
                expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(matDialogRef.close).not.toHaveBeenCalled();
            });
            it('unless the individual is now both a scheme and a concept', function() {
                component.types = ['type1', 'scheme', 'concept'];
                component.submit();
                expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1', 'type2']);
                expect(component.error).toBeTruthy();
                expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(matDialogRef.close).not.toHaveBeenCalled();
            });
            it('unless nothing changed', function() {
                component.submit();
                expect(ontologyStateStub.listItem.selected['@type']).toEqual([OWL + 'NamedIndividual', 'type1', 'type2']);
                expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call download when the button is clicked', function() {
        spyOn(component, 'submit');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.submit).toHaveBeenCalledWith();
    });
});
