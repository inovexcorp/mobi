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
describe('Create Mapping Overlay directive', function() {
    var $compile, scope, $q, mappingManagerSvc, mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('createMappingOverlay');
        mockMappingManager();
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            $q = _$q_;
        });

        mapperStateSvc.mapping = {record: {title: 'Record', description: 'description', keywords: ['keyword']}, ontology: [{}], jsonld: [{}], difference: {additions: []}};
        this.element = $compile(angular.element('<create-mapping-overlay></create-mapping-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createMappingOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('should initialize correctly', function() {
        it('if a mapping is selected', function() {
            expect(mapperStateSvc.createMapping).toHaveBeenCalled();
            expect(this.controller.newMapping.record).toEqual(mapperStateSvc.mapping.record);
            expect(this.controller.newMapping.ontology).toEqual(mapperStateSvc.mapping.ontology);
            expect(this.controller.newMapping.jsonld).toEqual(mapperStateSvc.mapping.jsonld);
        });
        it('if a mapping is not selected', function() {
            mapperStateSvc.mapping = undefined;
            // For some reason, at this point createMapping is returning the original value newMapping so I had to reset the mock
            mapperStateSvc.createMapping.and.returnValue({record: {}, ontology: undefined, jsonld: [], difference: {additions: [], deletions: []}});
            this.element = $compile(angular.element('<create-mapping-overlay></create-mapping-overlay>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('createMappingOverlay');
            expect(mapperStateSvc.createMapping).toHaveBeenCalled();
            expect(this.controller.newMapping.record).toEqual({});
            expect(this.controller.newMapping.ontology).toBeUndefined();
            expect(this.controller.newMapping.jsonld).toEqual([]);
        });
    });
    describe('controller methods', function() {
        describe('should set the correct state for continuing', function() {
            beforeEach(function() {
                this.id = 'id';
                this.newMapping = [{}];
                this.step = mapperStateSvc.step;
                mappingManagerSvc.getSourceOntologies.and.returnValue(this.ontologies);
                mapperStateSvc.displayCreateMappingOverlay = true;
                mappingManagerSvc.getMappingId.and.returnValue(this.id);
                mappingManagerSvc.createNewMapping.and.returnValue(this.newMapping);
            });
            it('if a brand new mapping is being created', function() {
                var ontologies = [];
                this.controller.newMapping.jsonld = [];
                this.controller.continue();
                expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(this.controller.newMapping.record.title);
                expect(mappingManagerSvc.createNewMapping).toHaveBeenCalledWith(this.id);
                expect(mappingManagerSvc.copyMapping).not.toHaveBeenCalled();
                expect(mappingManagerSvc.getSourceOntologyInfo).not.toHaveBeenCalled();
                expect(mappingManagerSvc.getSourceOntologies).not.toHaveBeenCalled();
                expect(mappingManagerSvc.areCompatible).not.toHaveBeenCalled();
                expect(mapperStateSvc.getClasses).not.toHaveBeenCalled();
                expect(this.controller.newMapping.jsonld).toEqual(this.newMapping);
                expect(mapperStateSvc.sourceOntologies).toEqual([]);
                expect(mapperStateSvc.availableClasses).toEqual([]);
                expect(mapperStateSvc.mapping).toEqual(this.controller.newMapping);
                expect(this.controller.newMapping.difference.additions).toEqual(this.newMapping);
                expect(mapperStateSvc.mappingSearchString).toBe('');
                expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);
                expect(mapperStateSvc.displayCreateMappingOverlay).toBe(false);
            });
            describe('if a copy of a mapping is being created', function() {
                beforeEach(function() {
                    this.ontologies = [{id: 'ontology'}];
                    this.sourceOntologyInfo = {};
                    this.originalJsonld = [{'@id': 'original'}];
                    this.copiedJsonld = [{'@id': 'copied'}];
                    this.controller.newMapping.jsonld = angular.copy(this.originalJsonld);
                    mappingManagerSvc.copyMapping.and.returnValue(this.copiedJsonld);
                    mappingManagerSvc.getSourceOntologyInfo.and.returnValue(this.sourceOntologyInfo);
                    mapperStateSvc.mappingSearchString = 'test';
                });
                it('unless getSourceOntologies is rejected', function() {
                    mappingManagerSvc.getSourceOntologies.and.returnValue($q.reject('Error message'));
                    this.controller.continue();
                    scope.$apply();
                    expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(this.controller.newMapping.record.title);
                    expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.copyMapping).toHaveBeenCalledWith(this.originalJsonld, this.id);
                    expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(this.copiedJsonld);
                    expect(mappingManagerSvc.getSourceOntologies).toHaveBeenCalledWith(this.sourceOntologyInfo);
                    expect(mappingManagerSvc.areCompatible).not.toHaveBeenCalled();
                    expect(mapperStateSvc.getClasses).not.toHaveBeenCalled();
                    expect(mapperStateSvc.sourceOntologies).not.toEqual(this.ontologies);
                    expect(mapperStateSvc.availableClasses).toEqual([]);
                    expect(mapperStateSvc.mappingSearchString).not.toBe('');
                    expect(mapperStateSvc.step).toBe(this.step);
                    expect(this.controller.errorMessage).toBe('Error retrieving mapping');
                    expect(this.controller.newMapping.jsonld).toEqual(this.copiedJsonld);
                    expect(mapperStateSvc.mapping).not.toEqual(this.controller.newMapping);
                    expect(mapperStateSvc.displayCreateMappingOverlay).toBe(true);
                });
                it('unless the source ontologies of the original mapping are not compatible', function() {
                    mappingManagerSvc.getSourceOntologies.and.returnValue($q.when(this.ontologies));
                    mappingManagerSvc.areCompatible.and.returnValue(false);
                    this.controller.continue();
                    scope.$apply();
                    expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(this.controller.newMapping.record.title);
                    expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.copyMapping).toHaveBeenCalledWith(this.originalJsonld, this.id);
                    expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(this.copiedJsonld);
                    expect(mappingManagerSvc.getSourceOntologies).toHaveBeenCalledWith(this.sourceOntologyInfo);
                    expect(mappingManagerSvc.areCompatible).toHaveBeenCalledWith(this.copiedJsonld, this.ontologies);
                    expect(mapperStateSvc.getClasses).not.toHaveBeenCalled();
                    expect(mapperStateSvc.sourceOntologies).not.toEqual(this.ontologies);
                    expect(mapperStateSvc.availableClasses).toEqual([]);
                    expect(mapperStateSvc.mappingSearchString).not.toBe('');
                    expect(mapperStateSvc.step).toBe(this.step);
                    expect(this.controller.errorMessage).toBe('The selected mapping is incompatible with its source ontologies');
                    expect(this.controller.newMapping.jsonld).toEqual(this.copiedJsonld);
                    expect(mapperStateSvc.mapping).not.toEqual(this.controller.newMapping);
                    expect(mapperStateSvc.displayCreateMappingOverlay).toBe(true);
                });
                it('successfully', function() {
                    mappingManagerSvc.getSourceOntologies.and.returnValue($q.when(this.ontologies));
                    mapperStateSvc.getClasses.and.returnValue([{}]);
                    this.controller.continue();
                    scope.$apply();
                    expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(this.controller.newMapping.record.title);
                    expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.copyMapping).toHaveBeenCalledWith(this.originalJsonld, this.id);
                    expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(this.copiedJsonld);
                    expect(mappingManagerSvc.getSourceOntologies).toHaveBeenCalledWith(this.sourceOntologyInfo);
                    expect(mappingManagerSvc.areCompatible).toHaveBeenCalledWith(this.copiedJsonld, this.ontologies);
                    expect(mapperStateSvc.getClasses).toHaveBeenCalledWith(this.ontologies);
                    expect(mapperStateSvc.sourceOntologies).toEqual(this.ontologies);
                    expect(mapperStateSvc.availableClasses).toEqual([{}]);
                    expect(mapperStateSvc.mappingSearchString).toBe('');
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);
                    expect(this.controller.errorMessage).toBe('');
                    expect(this.controller.newMapping.jsonld).toEqual(this.copiedJsonld);
                    expect(mapperStateSvc.mapping).toEqual(this.controller.newMapping);
                    expect(mapperStateSvc.displayCreateMappingOverlay).toBe(false);
                });
            });
        });
        it('should set the correct state for canceling', function() {
            this.controller.cancel();
            expect(mapperStateSvc.editMapping).toBe(false);
            expect(mapperStateSvc.newMapping).toBe(false);
            expect(mapperStateSvc.displayCreateMappingOverlay).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('create-mapping-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a title field', function() {
            expect(this.element.querySelectorAll('input[name="title"]').length).toBe(1);
        });
        it('with a text-area', function() {
            expect(this.element.find('text-area').length).toBe(1);
        });
        it('with a keyword-select', function() {
            expect(this.element.find('keyword-select').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.errorMessage = 'test';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on the validity of the form', function() {
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.newMapping.record.title = '';
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('with buttons to cancel and continue', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Continue']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Continue']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call continue when the button is clicked', function() {
        spyOn(this.controller, 'continue');
        var continueButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.continue).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var continueButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});