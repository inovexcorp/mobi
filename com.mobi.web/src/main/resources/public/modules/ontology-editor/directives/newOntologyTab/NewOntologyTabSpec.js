/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
describe('New Ontology Tab directive', function() {
    var $compile, scope, $q, ontologyStateSvc, utilSvc, stateManagerSvc, prefixes, ontoUtils, splitIRI;

    beforeEach(function() {
        module('templates');
        module('newOntologyTab');
        mockUtil();
        mockOntologyState();
        mockPrefixes();
        mockStateManager();
        mockOntologyUtilsManager();
        injectRegexConstant();
        injectCamelCaseFilter();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _utilService_, _stateManagerService_, _prefixes_, _ontologyUtilsManagerService_, _splitIRIFilter_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            utilSvc = _utilService_;
            stateManagerSvc = _stateManagerService_;
            prefixes = _prefixes_;
            ontoUtils = _ontologyUtilsManagerService_;
            splitIRI = _splitIRIFilter_;
        });

        ontologyStateSvc.newOntology = {'@id': 'ontology'};
        ontologyStateSvc.newOntology[prefixes.dcterms + 'title'] = [{'@value' : 'title'}];
        ontologyStateSvc.newOntology[prefixes.dcterms + 'description'] = [{'@value' : 'description'}];
        this.element = $compile(angular.element('<new-ontology-tab></new-ontology-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('newOntologyTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        utilSvc = null;
        stateManagerSvc = null;
        prefixes = null;
        ontoUtils = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('new-ontology-tab')).toBe(true);
            expect(this.element.querySelectorAll('.actions').length).toBe(1);
            expect(this.element.querySelectorAll('.form-container').length).toBe(1);
        });
        _.forEach(['block', 'block-content', 'form', 'custom-label', 'text-input', 'text-area', 'keyword-select'], function(item) {
            it('with a ' + item, function() {
                expect(this.element.find(item).length).toBe(1);
            });
        });
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with an advanced-language-select', function() {
            expect(this.element.find('advanced-language-select').length).toBe(1);
        });
        it('with custom buttons to create and cancel', function() {
            var buttons = this.element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.error = 'Error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on whether the ontology iri is valid', function() {
            var formGroup = angular.element(this.element.querySelectorAll('.form-group')[0]);
            expect(formGroup.hasClass('has-error')).toBe(false);

            this.controller.form = {
                iri: {
                    '$error': {
                        pattern: true
                    }
                }
            }
            scope.$digest();
            expect(formGroup.hasClass('has-error')).toBe(true);
        });
        it('depending on the form validity', function() {
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
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
                expect(ontologyStateSvc.newOntology['@id']).toBe('ontologytitle');
                expect(splitIRI).toHaveBeenCalledWith(this.original);
                expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(ontologyStateSvc.newOntology, prefixes.dcterms + 'title');
            });
            it('unless the iri has changed', function() {
                this.controller.iriHasChanged = true;
                this.controller.nameChanged();
                expect(ontologyStateSvc.newOntology['@id']).toBe(this.original);
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
                utilSvc.getPropertyValue.and.callFake(function(obj, prop) {
                    return prop === prefixes.dcterms + 'title' ? 'title' : this.description;
                }.bind(this));
            });
            it('unless an error occurs with creating the ontology', function() {
                ontologyStateSvc.createOntology.and.returnValue($q.reject(this.errorMessage));
                this.controller.create();
                scope.$apply();
                expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(ontologyStateSvc.newOntology, 'title', 'description', ['one', 'two']);
                expect(stateManagerSvc.createOntologyState).not.toHaveBeenCalled();
                expect(this.controller.error).toBe(this.errorMessage);
            });
            it('unless an error occurs with creating ontology state', function() {
                stateManagerSvc.createOntologyState.and.returnValue($q.reject(this.errorMessage));
                this.controller.create();
                scope.$apply();
                expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(ontologyStateSvc.newOntology, 'title', 'description', ['one', 'two']);
                expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(this.response.recordId, this.response.branchId, this.response.commitId);
                expect(this.controller.error).toBe(this.errorMessage);
            });
            describe('successfully', function() {
                it('with a description', function() {
                    this.controller.create();
                    scope.$apply();
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(ontologyStateSvc.newOntology, ontologyStateSvc.newLanguage);
                    expect(_.has(ontologyStateSvc.newOntology, prefixes.owl + 'imports')).toBe(false);
                    expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(ontologyStateSvc.newOntology, 'title', 'description', ['one', 'two']);
                    expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(this.response.recordId, this.response.branchId, this.response.commitId);
                    expect(ontologyStateSvc.showNewTab).toBe(false);
                });
                it('without description', function() {
                    this.description = '';
                    this.controller.create();
                    scope.$apply();
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(ontologyStateSvc.newOntology, ontologyStateSvc.newLanguage);
                    expect(_.has(ontologyStateSvc.newOntology, prefixes.owl + 'imports')).toBe(false);
                    expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(ontologyStateSvc.newOntology, 'title', '', ['one', 'two']);
                    expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(this.response.recordId, this.response.branchId, this.response.commitId);
                    expect(ontologyStateSvc.showNewTab).toBe(false);
                });
                it('over 100 times', function() {
                    this.description = '';
                    this.controller.create();
                    for(var i = 0; i < 150; i++)
                    {
                        ontologyStateSvc.newOntology[prefixes.dcterms + 'title'] = [{'@value' : 'title' + i}];
                        scope.$apply();
                    }
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(ontologyStateSvc.newOntology, ontologyStateSvc.newLanguage);
                    expect(_.has(ontologyStateSvc.newOntology, prefixes.owl + 'imports')).toBe(false);
                    expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(ontologyStateSvc.newOntology, 'title', '', ['one', 'two']);
                    expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(this.response.recordId, this.response.branchId, this.response.commitId);
                    expect(ontologyStateSvc.showNewTab).toBe(false);
                });
            });
        });
    });
    it('should call create when the button is clicked', function() {
        spyOn(this.controller, 'create');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.create).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showNewTab).toBe(false);
    });
});
