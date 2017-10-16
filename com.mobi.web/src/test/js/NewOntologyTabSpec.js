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
    var $compile, scope, $q, element, controller, ontologyStateSvc, utilSvc, stateManagerSvc, prefixes, ontoUtils;

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

        element = $compile(angular.element('<new-ontology-tab></new-ontology-tab>'))(scope);
        scope.$digest();
        controller = element.controller('newOntologyTab');
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('new-ontology-tab')).toBe(true);
            expect(element.querySelectorAll('.actions').length).toBe(1);
            expect(element.querySelectorAll('.form-container').length).toBe(1);
        });
        _.forEach(['block', 'block-content', 'form', 'custom-label', 'text-input', 'text-area', 'keyword-select', 'editor-radio-buttons'], function(item) {
            it('with a ' + item, function() {
                expect(element.find(item).length).toBe(1);
            });
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with an advanced-language-select', function() {
            expect(element.find('advanced-language-select').length).toBe(1);
        });
        it('with custom buttons to create and cancel', function() {
            var buttons = element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on whether there is an error', function() {
            expect(element.find('error-display').length).toBe(0);
            controller.error = 'Error';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on whether the ontology iri is valid', function() {
            var formGroup = angular.element(element.querySelectorAll('.form-group')[0]);
            expect(formGroup.hasClass('has-error')).toBe(false);

            controller.form = {
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
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('should update the id', function() {
            beforeEach(function() {
                this.prefix = controller.ontology['@id'];
                controller.title = 'title';
            });
            it('if the iri has not changed', function() {
                controller.nameChanged();
                expect(controller.ontology['@id']).toBe(this.prefix + controller.title);
            });
            it('unless the iri has changed', function() {
                controller.iriHasChanged = true;
                controller.nameChanged();
                expect(controller.ontology['@id']).toBe(this.prefix);
            });
        });
        describe('should create an ontology', function() {
            beforeEach(function() {
                controller.title = 'title';
                controller.description = 'description';
                controller.keywords = [' one', 'two '];
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
                controller.create();
                scope.$apply();
                expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(controller.ontology, controller.title, controller.description, 'one,two', controller.type);
                expect(stateManagerSvc.createOntologyState).not.toHaveBeenCalled();
                expect(controller.error).toBe(this.errorMessage);
            });
            it('unless an error occurs with creating ontology state', function() {
                stateManagerSvc.createOntologyState.and.returnValue($q.reject(this.errorMessage));
                controller.create();
                scope.$apply();
                expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(controller.ontology, controller.title, controller.description, 'one,two', controller.type);
                expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(this.response.recordId, this.response.branchId, this.response.commitId);
                expect(controller.error).toBe(this.errorMessage);
            });
            describe('successfully', function() {
                it('if it is an ontology', function() {
                    controller.type = 'ontology';
                    controller.create();
                    scope.$apply();
                    expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(controller.ontology, 'title', controller.title);
                    expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(controller.ontology, 'description', controller.description);
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(controller.ontology, controller.language);
                    expect(_.has(controller.ontology, prefixes.owl + 'imports')).toBe(false);
                    expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(controller.ontology, controller.title, controller.description, 'one,two', controller.type);
                    expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(this.response.recordId, this.response.branchId, this.response.commitId);
                    expect(ontologyStateSvc.showNewTab).toBe(false);
                });
                it('if it is a vocabulary', function() {
                    controller.type = 'vocabulary';
                    controller.create();
                    scope.$apply();
                    expect(controller.ontology[prefixes.owl + 'imports']).toEqual([{'@id': prefixes.skos.slice(0, -1)}]);
                    expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(controller.ontology, 'title', controller.title);
                    expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(controller.ontology, 'description', controller.description);
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(controller.ontology, controller.language);
                    expect(ontologyStateSvc.createOntology).toHaveBeenCalledWith(controller.ontology, controller.title, controller.description, 'one,two', controller.type);
                    expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(this.response.recordId, this.response.branchId, this.response.commitId);
                    expect(ontologyStateSvc.showNewTab).toBe(false);
                });
            });
        });
    });
    it('should call create when the button is clicked', function() {
        spyOn(controller, 'create');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.create).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showNewTab).toBe(false);
    });
});
