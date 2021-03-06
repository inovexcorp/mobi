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
    mockUtil,
    mockOntologyState,
    mockPrefixes,
    mockOntologyUtilsManager,
    injectRegexConstant,
    injectCamelCaseFilter,
    injectSplitIRIFilter
} from '../../../../../../test/js/Shared';

describe('New Ontology Overlay component', function() {
    var $compile, scope, $q, ontologyStateSvc, utilSvc, prefixes, ontoUtils, splitIRI;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'advancedLanguageSelect');
        mockUtil();
        mockOntologyState();
        mockPrefixes();
        mockOntologyUtilsManager();
        injectRegexConstant();
        injectCamelCaseFilter();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _utilService_, _prefixes_, _ontologyUtilsManagerService_, _splitIRIFilter_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            ontoUtils = _ontologyUtilsManagerService_;
            splitIRI = _splitIRIFilter_;
        });

        ontologyStateSvc.newOntology = {
            '@id': 'ontology',
            [prefixes.dcterms + 'title']: [{'@value' : 'title'}],
            [prefixes.dcterms + 'description']: [{'@value' : 'description'}]
        };

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<new-ontology-overlay close="close()" dismiss="dismiss()"></new-ontology-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('newOntologyOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        utilSvc = null;
        prefixes = null;
        ontoUtils = null;
        splitIRI = null;
        this.element.remove();
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
            expect(this.element.prop('tagName')).toEqual('NEW-ONTOLOGY-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        _.forEach(['form', 'custom-label', 'text-input', 'text-area', 'keyword-select', 'advanced-language-select'], function(item) {
            it('with a ' + item, function() {
                expect(this.element.find(item).length).toEqual(1);
            });
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[0]).text()) >= 0).toEqual(true);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[1]).text()) >= 0).toEqual(true);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toEqual(0);
            this.controller.error = 'Error';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
        it('depending on whether the ontology iri is valid', function() {
            var iriInput = angular.element(this.element.querySelectorAll('.form-group input')[0]);
            expect(iriInput.hasClass('is-invalid')).toEqual(false);

            this.controller.form = {
                iri: {
                    '$error': {
                        pattern: true
                    }
                }
            }
            scope.$digest();
            expect(iriInput.hasClass('is-invalid')).toEqual(true);
        });
        it('depending on the form validity', function() {
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.form.$invalid = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        describe('should update the id', function() {
            beforeEach(function() {
                this.original = ontologyStateSvc.newOntology['@id'];
                splitIRI.and.returnValue({begin: 'ontology', then: ''});
                utilSvc.getPropertyValue.and.returnValue('title');
            });
            it('if the iri has not changed', function() {
                this.controller.nameChanged();
                expect(ontologyStateSvc.newOntology['@id']).toEqual('ontologytitle');
                expect(splitIRI).toHaveBeenCalledWith(this.original);
                expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(ontologyStateSvc.newOntology, prefixes.dcterms + 'title');
            });
            it('unless the iri has changed', function() {
                this.controller.iriHasChanged = true;
                this.controller.nameChanged();
                expect(ontologyStateSvc.newOntology['@id']).toEqual(this.original);
                expect(splitIRI).not.toHaveBeenCalled();
            });
        });
        describe('should create an ontology', function() {
            beforeEach(function() {
                ontologyStateSvc.newKeywords = [' one', 'two '];
                this.response = {
                    recordId: 'record',
                    branchId: 'branch',
                    commitId: 'commit',
                    entityIRI: 'entity'
                };
                ontologyStateSvc.createOntology.and.returnValue($q.when(this.response));
                this.errorMessage = 'Error message';
                this.description = 'description';
                utilSvc.getPropertyValue.and.callFake((obj, prop) => prop === prefixes.dcterms + 'title' ? 'title' : this.description);
            });
            it('unless an error occurs with creating the ontology', function() {
                ontologyStateSvc.createOntology.and.returnValue($q.reject(this.errorMessage));
                this.controller.create();
                scope.$apply();
                expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(ontologyStateSvc.newOntology, 'title', 'description', ['one', 'two']);
                expect(ontologyStateSvc.createOntologyState).not.toHaveBeenCalled();
                expect(this.controller.error).toEqual(this.errorMessage);
                expect(scope.close).not.toHaveBeenCalled();
            });
            it('unless an error occurs with creating ontology state', function() {
                ontologyStateSvc.createOntologyState.and.returnValue($q.reject(this.errorMessage));
                this.controller.create();
                scope.$apply();
                expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(ontologyStateSvc.newOntology, 'title', 'description', ['one', 'two']);
                expect(ontologyStateSvc.createOntologyState).toHaveBeenCalledWith({recordId: this.response.recordId, commitId: this.response.commitId, branchId: this.response.branchId});
                expect(scope.close).not.toHaveBeenCalled();
                expect(this.controller.error).toEqual(this.errorMessage);
            });
            describe('successfully', function() {
                it('with a description', function() {
                    this.controller.create();
                    scope.$apply();
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(ontologyStateSvc.newOntology, ontologyStateSvc.newLanguage);
                    expect(_.has(ontologyStateSvc.newOntology, prefixes.owl + 'imports')).toEqual(false);
                    expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(ontologyStateSvc.newOntology, 'title', 'description', ['one', 'two']);
                    expect(ontologyStateSvc.createOntologyState).toHaveBeenCalledWith({recordId: this.response.recordId, commitId: this.response.commitId, branchId: this.response.branchId});
                    expect(scope.close).toHaveBeenCalled();
                });
                it('without description', function() {
                    this.description = '';
                    this.controller.create();
                    scope.$apply();
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(ontologyStateSvc.newOntology, ontologyStateSvc.newLanguage);
                    expect(_.has(ontologyStateSvc.newOntology, prefixes.owl + 'imports')).toEqual(false);
                    expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(ontologyStateSvc.newOntology, 'title', '', ['one', 'two']);
                    expect(ontologyStateSvc.createOntologyState).toHaveBeenCalledWith({recordId: this.response.recordId, commitId: this.response.commitId, branchId: this.response.branchId});
                    expect(scope.close).toHaveBeenCalled();
                });
            });
        });
    });
    it('should call create when the submit button is clicked', function() {
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
