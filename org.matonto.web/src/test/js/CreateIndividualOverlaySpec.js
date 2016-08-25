/*-
 * #%L
 * org.matonto.web
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
describe('Create Individual Overlay directive', function() {
    var $compile,
        scope,
        element,
        controller,
        ontologyManagerSvc,
        stateManagerSvc,
        resObj,
        deferred,
        prefixes,
        $timeout;

    beforeEach(function() {
        module('templates');
        module('createIndividualOverlay');
        injectCamelCaseFilter();
        mockOntologyManager();
        mockStateManager();
        mockResponseObj();
        mockPrefixes();

        inject(function(_$q_, _$compile_, _$rootScope_, _$timeout_, _ontologyManagerService_, _stateManagerService_, _responseObj_, _prefixes_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            stateManagerSvc = _stateManagerService_;
            deferred = _$q_.defer();
            prefixes = _prefixes_;
            resObj = _responseObj_;
            $timeout = _$timeout_;
        });
    });

    describe('initializes with the correct values', function() {
        it('if parent ontology is opened', function() {
            var ontology = {iriBegin: 'begin', iriThen: '/'};
            ontologyManagerSvc.getListItemById.and.returnValue(ontology);
            element = $compile(angular.element('<create-individual-overlay></create-individual-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('createIndividualOverlay');
            expect(controller.prefix).toBe(ontology.iriBegin + ontology.iriThen);
            expect(controller.individual['@id']).toBe(controller.prefix);
            expect(controller.individual['@type']).toEqual([]);
        });
        it('if parent ontology is not opened', function() {
            ontologyManagerSvc.getListItemById.and.returnValue(undefined);
            ontologyManagerSvc.getOntologyIRI.and.returnValue('iri');
            element = $compile(angular.element('<create-individual-overlay></create-individual-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('createIndividualOverlay');
            expect(controller.prefix).toBe('iri#');
            expect(controller.individual['@id']).toBe(controller.prefix);
            expect(controller.individual['@type']).toEqual([]);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<create-individual-overlay></create-individual-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('overlay')).toBe(true);
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('based on form', function() {
            var forms = element.find('form');
            expect(forms.length).toBe(1);
        });
        it('with a static iri', function() {
            expect(element.find('static-iri').length).toBe(1);
        });
        it('with a string select', function() {
            expect(element.find('string-select').length).toBe(1);
        });
        it('with an input for the individual name', function() {
            expect(element.querySelectorAll('input[name="name"]').length).toBe(1);
        });
        it('with custom buttoms to create and cancel', function() {
            var buttons = element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on if there is an error', function() {
            expect(element.find('error-display').length).toBe(0);
            controller = element.controller('createIndividualOverlay');
            controller.error = 'error';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyManagerSvc.getOntologyIRI.and.returnValue('iri');
            element = $compile(angular.element('<create-individual-overlay></create-individual-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('createIndividualOverlay');
        });
        describe('should update the individual id', function() {
            beforeEach(function() {
                controller.name = 'name';
                this.id = controller.individual['@id'];
            });
            it('unless the IRI has not changed', function() {
                controller.iriHasChanged = false;
                controller.nameChanged();
                expect(controller.individual['@id']).toBe(controller.prefix + controller.name);
            });
            it('if the IRI has changed', function() {
                controller.iriHasChanged = true;
                controller.nameChanged();
                expect(controller.individual['@id']).toBe(this.id);
            });
        });
        it('should change the individual IRI based on the params', function() {
            controller.onEdit('begin', 'then', 'end');
            expect(controller.iriHasChanged).toBe(true);
            expect(controller.individual['@id']).toBe('begin' + 'then' + 'end');
        });
        describe('should create an individual', function() {
            beforeEach(function() {
                ontologyManagerSvc.createIndividual.and.returnValue(deferred.promise);
            });
            it('unless an error occurs', function() {
                deferred.reject('error');
                controller.create();
                $timeout.flush();
                expect(controller.error).toBe('error');
            });
            it('successfully', function() {
                var response = {entityIRI: 'iri', ontologyId: 'id'};
                deferred.resolve(response);
                controller.create();
                $timeout.flush();
                expect(stateManagerSvc.showCreateIndividualOverlay).toBe(false);
                expect(ontologyManagerSvc.getListItemById).toHaveBeenCalledWith(response.ontologyId);
                expect(stateManagerSvc.selectItem).toHaveBeenCalled();
                expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(response.ontologyId);
                expect(stateManagerSvc.setOpened).toHaveBeenCalled();
            });
        });
    });
});
