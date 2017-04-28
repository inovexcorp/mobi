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
describe('Open Ontology Tab directive', function() {
    var $compile, scope, $q, element, controller, ontologyStateSvc, ontologyManagerSvc, catalogManagerSvc,
        stateManagerSvc, prefixes, util;

    beforeEach(function() {
        module('templates');
        module('openOntologyTab');
        injectHighlightFilter();
        injectTrustedFilter();
        mockCatalogManager();
        mockOntologyManager();
        mockOntologyState();
        mockPrefixes();
        mockStateManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_, _catalogManagerService_, _stateManagerService_, _prefixes_, _utilService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            stateManagerSvc = _stateManagerService_;
            prefixes = _prefixes_;
            util = _utilService_;
        });

        this.records = [{'@id': 'recordA'}, {'@id': 'recordB'}];
        this.records[0][prefixes.dcterms + 'identifier'] = [{'@value': 'A'}];
        this.records[1][prefixes.dcterms + 'identifier'] = [{'@value': 'B'}];
        ontologyManagerSvc.getAllOntologyRecords.and.returnValue($q.when(this.records));
        util.getDctermsValue.and.returnValue('A');
        element = $compile(angular.element('<open-ontology-tab></open-ontology-tab>'))(scope);
        scope.$digest();
        controller = element.controller('openOntologyTab');
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('open-ontology-tab')).toBe(true);
            expect(element.querySelectorAll('.actions').length).toBe(1);
            expect(element.querySelectorAll('.list').length).toBe(1);
            expect(element.querySelectorAll('.open-ontology-content').length).toBe(1);
            expect(element.querySelectorAll('.ontologies').length).toBe(1);
            expect(element.querySelectorAll('.paging-container').length).toBe(1);
        });
        _.forEach(['block', 'block-content', 'form', 'block-footer', 'pagination'], function(item) {
            it('with a ' + item, function() {
                expect(element.find(item).length).toBe(1);
            });
        });
        it('with custom buttons to upload an ontology and make a new ontology', function() {
            var buttons = element.querySelectorAll('.actions button');
            expect(buttons.length).toBe(2);
            expect(['Upload Ontology', 'New Ontology'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Upload Ontology', 'New Ontology'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on whether an ontology is being deleted', function() {
            expect(element.querySelectorAll('confirmation-overlay[header-text="\'Delete Ontology\'"]').length).toBe(0);

            controller.showDeleteConfirmation = true;
            scope.$digest();
            expect(element.querySelectorAll('confirmation-overlay[header-text="\'Delete Ontology\'"]').length).toBe(1);
        });
        it('depending on whether an ontology is being opened', function() {
            expect(element.querySelectorAll('confirmation-overlay[header-text="\'Open\'"]').length).toBe(0);

            controller.showOpenOverlay = true;
            scope.$digest();
            expect(element.querySelectorAll('confirmation-overlay[header-text="\'Open\'"]').length).toBe(1);
        });
        it('depending on whether there is an error deleting an ontology', function() {
            controller.showDeleteConfirmation = true;
            scope.$digest();
            expect(element.find('error-display').length).toBe(0);
            controller.errorMessage = 'Error';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on what type of ontology is being opened', function() {
            controller.showOpenOverlay = true;
            controller.type = 'ontology';
            scope.$digest();
            var typeBtns = element.querySelectorAll('confirmation-overlay .type');
            expect(angular.element(typeBtns[0]).hasClass('active')).toBe(true);
            expect(angular.element(typeBtns[1]).hasClass('active')).toBe(false);

            controller.type = 'vocabulary';
            scope.$digest();
            expect(angular.element(typeBtns[0]).hasClass('active')).toBe(false);
            expect(angular.element(typeBtns[1]).hasClass('active')).toBe(true);
        });
        it('depending on how many unopened ontologies there are, the limit, and the offset', function() {
            controller.filteredList = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
            controller.limit = 10;
            controller.begin = 0;
            scope.$digest();
            expect(element.querySelectorAll('.ontologies .ontology').length).toBe(10);
            expect(element.querySelectorAll('.ontologies .text-info.message').length).toBe(0);

            controller.begin = 10;
            scope.$digest();
            expect(element.querySelectorAll('.ontologies .ontology').length).toBe(1);
            expect(element.querySelectorAll('.ontologies .text-info.message').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        describe('should open an ontology', function() {
            it('unless an error occurs', function() {
                ontologyStateSvc.openOntology.and.returnValue($q.reject('Error message'));
                controller.open();
                scope.$apply();
                expect(ontologyStateSvc.openOntology).toHaveBeenCalledWith(controller.recordId, controller.type);
                expect(ontologyStateSvc.addState).not.toHaveBeenCalled();
                expect(ontologyStateSvc.setState).not.toHaveBeenCalled();
                expect(controller.errorMessage).toBe('Error message');
            });
            it('successfully', function() {
                var ontologyId = 'ontologyId';
                ontologyStateSvc.openOntology.and.returnValue($q.resolve(ontologyId));
                controller.open();
                scope.$apply();
                expect(ontologyStateSvc.openOntology).toHaveBeenCalledWith(controller.recordId, controller.type);
                expect(ontologyStateSvc.addState).toHaveBeenCalledWith(controller.recordId, ontologyId, controller.type);
                expect(ontologyStateSvc.setState).toHaveBeenCalledWith(controller.recordId);
                expect(controller.errorMessage).toBeUndefined();
            });
        });
        it('should get a page of results', function() {
            var begin = controller.begin;
            controller.getPage('next');
            expect(controller.begin).toBe(begin + controller.limit);

            begin = controller.begin;
            controller.getPage('prev');
            expect(controller.begin).toBe(begin - controller.limit);
        });
        it('should show the delete confirmation overlay', function() {
            util.getDctermsValue.and.returnValue('title');
            controller.showDeleteConfirmationOverlay({'@id': 'record'});
            expect(controller.recordId).toBe('record');
            expect(controller.recordTitle).toBe('title');
            expect(controller.errorMessage).toBe('');
            expect(controller.showDeleteConfirmation).toBe(true);
        });
        describe('should delete an ontology', function() {
            beforeEach(function() {
                controller.showDeleteConfirmation = true;
                controller.recordId = 'recordA';
                stateManagerSvc.getOntologyStateByRecordId.and.returnValue({id: 'state'});
            });
            it('unless an error occurs', function() {
                ontologyManagerSvc.deleteOntology.and.returnValue($q.reject('Error message'));
                controller.deleteOntology();
                scope.$apply();
                expect(ontologyManagerSvc.deleteOntology).toHaveBeenCalledWith(controller.recordId);
                expect(this.records).toContain(jasmine.objectContaining({'@id': 'recordA'}));
                expect(stateManagerSvc.getOntologyStateByRecordId).not.toHaveBeenCalled();
                expect(stateManagerSvc.deleteState).not.toHaveBeenCalled();
                expect(controller.showDeleteConfirmation).toBe(true);
                expect(controller.errorMessage).toBe('Error message');
            });
            it('successfully', function() {
                controller.deleteOntology();
                scope.$apply();
                expect(ontologyManagerSvc.deleteOntology).toHaveBeenCalledWith(controller.recordId);
                expect(this.records).not.toContain(jasmine.objectContaining({'@id': 'recordA'}));
                expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalled();
                expect(stateManagerSvc.deleteState).toHaveBeenCalledWith('state');
                expect(controller.showDeleteConfirmation).toBe(false);
                expect(controller.errorMessage).toBeUndefined();
            });
        });
        it('should get the list of unopened ontology records', function() {
            ontologyStateSvc.list = [{'recordId': 'recordA'}];
            controller.getAllOntologyRecords('sort');
            scope.$apply();
            expect(ontologyManagerSvc.getAllOntologyRecords).toHaveBeenCalledWith('sort');
            expect(controller.filteredList).not.toContain(jasmine.objectContaining({'@id': 'recordA'}));
        });
    });
    it('should filter the ontology list when the filter text changes', function() {
        util.getDctermsValue.and.callFake(function(obj, filter) {
            return obj['@id'] === 'recordA' ? 'test' : '';
        });
        controller.filterText = 'test';
        scope.$apply();
        expect(controller.filterText).not.toContain(jasmine.objectContaining({'@id': 'recordB'}));
    });
    it('should set the correct state when the new ontology button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.actions button')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showNewTab).toBe(true);
    });
    it('should set the correct state when the upload ontology button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.actions button')[1]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showUploadTab).toBe(true);
    });
    it('should set the correct state when an ontology is clicked', function() {
        var ontology = angular.element(element.querySelectorAll('.ontologies .ontology')[0]);
        ontology.triggerHandler('click');
        expect(controller.recordId).toBe('recordA');
        expect(controller.showOpenOverlay).toBe(true);
    });
    it('should call showDeleteConfirmationOverlay when a delete link is clicked', function() {
        spyOn(controller, 'showDeleteConfirmationOverlay');
        var link = angular.element(element.querySelectorAll('.ontologies .ontology .action-container a')[0]);
        link.triggerHandler('click');
        expect(controller.showDeleteConfirmationOverlay).toHaveBeenCalledWith(controller.filteredList[0]);
    });
    it('should set the correct state when a ontology type button is clicked', function() {
        controller.showOpenOverlay = true;
        scope.$digest();
        var typeBtns = element.querySelectorAll('confirmation-overlay .type');
        angular.element(typeBtns[0]).triggerHandler('click');
        expect(controller.type).toBe('ontology');
        angular.element(typeBtns[1]).triggerHandler('click');
        expect(controller.type).toBe('vocabulary');
    });
});
