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
    var $compile, scope, $q, ontologyStateSvc, utilSvc, stateManagerSvc, prefixes, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('newOntologyTab');
        injectRegexConstant();
        injectCamelCaseFilter();
        mockUtil();
        mockOntologyState();
        mockPrefixes();
        mockStateManager();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _utilService_, _stateManagerService_, _prefixes_, _ontologyUtilsManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            utilSvc = _utilService_;
            stateManagerSvc = _stateManagerService_;
            prefixes = _prefixes_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

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
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('should update the id', function() {
            beforeEach(function() {
                this.prefix = this.controller.ontology['@id'];
                this.controller.title = 'title';
            });
            it('if the iri has not changed', function() {
                this.controller.nameChanged();
                expect(this.controller.ontology['@id']).toBe(this.prefix + this.controller.title);
            });
            it('unless the iri has changed', function() {
                this.controller.iriHasChanged = true;
                this.controller.nameChanged();
                expect(this.controller.ontology['@id']).toBe(this.prefix);
            });
        });
        describe('should create an ontology', function() {
            beforeEach(function() {
                this.controller.title = 'title';
                this.controller.description = 'description';
                this.controller.keywords = [' one', 'two '];
                this.response = {
                    recordId: 'record',
                    branchId: 'branch',
                    commitId: 'commit',
                    entityIRI: 'entity'
                };
                ontologyStateSvc.createOntology.and.returnValue($q.when(this.response));
                this.errorMessage = 'Error message';
            });
            it('unless an error occurs with creating the ontology', function() {
                ontologyStateSvc.createOntology.and.returnValue($q.reject(this.errorMessage));
                this.controller.create();
                scope.$apply();
                expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(this.controller.ontology, this.controller.title, this.controller.description, 'one,two');
                expect(stateManagerSvc.createOntologyState).not.toHaveBeenCalled();
                expect(this.controller.error).toBe(this.errorMessage);
            });
            it('unless an error occurs with creating ontology state', function() {
                stateManagerSvc.createOntologyState.and.returnValue($q.reject(this.errorMessage));
                this.controller.create();
                scope.$apply();
                expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(this.controller.ontology, this.controller.title, this.controller.description, 'one,two');
                expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(this.response.recordId, this.response.branchId, this.response.commitId);
                expect(this.controller.error).toBe(this.errorMessage);
            });
            it('successfully', function() {
                this.controller.create();
                scope.$apply();
                expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(this.controller.ontology, 'title', this.controller.title);
                expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(this.controller.ontology, 'description', this.controller.description);
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.ontology, this.controller.language);
                expect(_.has(this.controller.ontology, prefixes.owl + 'imports')).toBe(false);
                expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(this.controller.ontology, this.controller.title, this.controller.description, 'one,two');
                expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(this.response.recordId, this.response.branchId, this.response.commitId);
                expect(ontologyStateSvc.showNewTab).toBe(false);
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
