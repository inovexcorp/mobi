/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import {
    mockComponent,
    mockOntologyState,
    mockPrefixes,
    mockOntologyUtilsManager,
    injectCamelCaseFilter
} from '../../../../../../test/js/Shared';

describe('Create Individual Overlay component', function() {
    var $compile, scope, ontologyStateSvc, prefixes, ontoUtils;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'staticIri');
        mockComponent('ontology-editor', 'ontologyClassSelect');
        mockOntologyState();
        mockPrefixes();
        mockOntologyUtilsManager();
        injectCamelCaseFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _prefixes_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        this.iri = 'iri#'
        ontologyStateSvc.getDefaultPrefix.and.returnValue(this.iri);

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<create-individual-overlay close="close()" dismiss="dismiss()"></create-individual-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createIndividualOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        prefixes = null;
        ontoUtils = null;
        this.element.remove();
    });

    it('initializes with the correct values', function() {
        expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
        expect(this.controller.prefix).toEqual(this.iri);
        expect(this.controller.individual['@id']).toEqual(this.controller.prefix);
        expect(this.controller.individual['@type']).toEqual([]);
    });
    describe('controller bound variable', function() {
        it('close should be called in the parent scope', function() {
            this.controller.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in the parent scope', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CREATE-INDIVIDUAL-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        _.forEach(['form', 'static-iri', 'ontology-class-select'], el => {
            it('with a ' + el, function() {
                expect(this.element.find(el).length).toEqual(1);
            });
        });
        it('with an input for the individual name', function() {
            expect(this.element.querySelectorAll('input[name="name"]').length).toEqual(1);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[0]).text().trim()) >= 0).toEqual(true);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[1]).text().trim()) >= 0).toEqual(true);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toEqual(0);
            this.controller.error = 'error';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
        it('depending on the form validity', function() {
            this.controller.individual['@type'] = ['ClassA'];
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.name = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on the length of the type array', function() {
            this.controller.name = 'test';
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.individual['@type'] = ['ClassA'];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the individual IRI already exists in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(true);
            scope.$digest();

            var disabled = this.element.querySelectorAll('[disabled]');
            expect(disabled.length).toEqual(1);
            expect(angular.element(disabled[0]).text().trim()).toEqual('Submit');
        });
    });
    describe('controller methods', function() {
        describe('should update the individual id', function() {
            beforeEach(function() {
                this.controller.name = 'name';
                this.id = this.controller.individual['@id'];
            });
            it('unless the IRI has not changed', function() {
                this.controller.iriHasChanged = false;
                this.controller.nameChanged();
                expect(this.controller.individual['@id']).toEqual(this.controller.prefix + this.controller.name);
            });
            it('if the IRI has changed', function() {
                this.controller.iriHasChanged = true;
                this.controller.nameChanged();
                expect(this.controller.individual['@id']).toEqual(this.id);
            });
        });
        it('should change the individual IRI based on the params', function() {
            this.controller.onEdit('begin', 'then', 'end');
            expect(this.controller.iriHasChanged).toEqual(true);
            expect(this.controller.individual['@id']).toEqual('begin' + 'then' + 'end');
            expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        describe('should create an individual', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem = {
                    ontologyRecord: {recordId: 'recordId'},
                    goTo: {
                        entityIRI: '',
                        active: false
                    }
                };
                ontologyStateSvc.createFlatIndividualTree.and.returnValue([{prop: 'individual'}]);
                ontologyStateSvc.getPathsTo.and.returnValue([['ClassA']]);
                this.controller.individual = {'@id': 'id', '@type': ['ClassA']};
                ontologyStateSvc.flattenHierarchy.and.returnValue(['ClassA']);
            });
            it('if it is a derived concept', function() {
                ontoUtils.containsDerivedConcept.and.returnValue(true);
                this.controller.create();
                expect(ontoUtils.addIndividual).toHaveBeenCalledWith(this.controller.individual);
                expect(this.controller.individual['@type']).toContain(prefixes.owl + 'NamedIndividual');
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(this.controller.individual);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.individual);
                expect(ontoUtils.addConcept).toHaveBeenCalledWith(this.controller.individual);
                expect(ontoUtils.addConceptScheme).not.toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('id');
                expect(ontologyStateSvc.listItem.goTo.active).toEqual(true);
            });
            it('if it is a derived conceptScheme', function() {
                ontoUtils.containsDerivedConceptScheme.and.returnValue(true);
                this.controller.create();
                expect(ontoUtils.addIndividual).toHaveBeenCalledWith(this.controller.individual);
                expect(this.controller.individual['@type']).toContain(prefixes.owl + 'NamedIndividual');
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(this.controller.individual);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.individual);
                expect(ontoUtils.addConcept).not.toHaveBeenCalled();
                expect(ontoUtils.addConceptScheme).toHaveBeenCalledWith(this.controller.individual);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('id');
                expect(ontologyStateSvc.listItem.goTo.active).toEqual(true);
            });
            it('if it is not a derived concept or a concept', function() {
                this.controller.create();
                expect(ontoUtils.addIndividual).toHaveBeenCalledWith(this.controller.individual);
                expect(this.controller.individual['@type']).toContain(prefixes.owl + 'NamedIndividual');
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(this.controller.individual);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.individual);
                expect(ontoUtils.addConcept).not.toHaveBeenCalled();
                expect(ontoUtils.addConceptScheme).not.toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('id');
                expect(ontologyStateSvc.listItem.goTo.active).toEqual(true);
            });
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    it('should call create when the button is clicked', function() {
        spyOn(this.controller, 'create');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.create).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});
