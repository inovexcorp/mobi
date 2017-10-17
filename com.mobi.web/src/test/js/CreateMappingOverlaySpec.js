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
    var $compile, scope, element, controller, $q, mappingManagerSvc, mapperStateSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('createMappingOverlay');
        mockMappingManager();
        mockMapperState();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_, _prefixes_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            prefixes = _prefixes_;
            $q = _$q_;
        });

        mapperStateSvc.mapping = {record: {title: 'Record', description: 'description', keywords: ['keyword']}, ontology: [{}], jsonld: [{}], difference: {additions: []}};
        element = $compile(angular.element('<create-mapping-overlay></create-mapping-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('createMappingOverlay');
    });

    describe('should initialize correctly', function() {
        it('if a mapping is selected', function() {
            expect(mapperStateSvc.createMapping).toHaveBeenCalled();
            expect(controller.newMapping.record).toEqual(mapperStateSvc.mapping.record);
            expect(controller.newMapping.ontology).toEqual(mapperStateSvc.mapping.ontology);
            expect(controller.newMapping.jsonld).toEqual(mapperStateSvc.mapping.jsonld);
        });
        it('if a mapping is not selected', function() {
            mapperStateSvc.mapping = undefined;
            // For some reason, at this point createMapping is returning the original value newMapping so I had to reset the mock
            mapperStateSvc.createMapping.and.returnValue({record: {}, ontology: undefined, jsonld: [], difference: {additions: [], deletions: []}});
            element = $compile(angular.element('<create-mapping-overlay></create-mapping-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('createMappingOverlay');
            expect(mapperStateSvc.createMapping).toHaveBeenCalled();
            expect(controller.newMapping.record).toEqual({});
            expect(controller.newMapping.ontology).toBeUndefined();
            expect(controller.newMapping.jsonld).toEqual([]);
        });
    });
    describe('controller methods', function() {
        describe('should set the correct state for continuing', function() {
            var id = 'id', newMapping = [{}], step;
            beforeEach(function() {
                step = mapperStateSvc.step;
                mappingManagerSvc.getSourceOntologies.and.returnValue(this.ontologies);
                mapperStateSvc.displayCreateMappingOverlay = true;
                mappingManagerSvc.getMappingId.and.returnValue(id);
                mappingManagerSvc.createNewMapping.and.returnValue(newMapping);
            });
            it('if a brand new mapping is being created', function() {
                var ontologies = [];
                controller.newMapping.jsonld = [];
                controller.continue();
                expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newMapping.record.title);
                expect(mappingManagerSvc.createNewMapping).toHaveBeenCalledWith(id);
                expect(mappingManagerSvc.copyMapping).not.toHaveBeenCalled();
                expect(mappingManagerSvc.getSourceOntologyInfo).not.toHaveBeenCalled();
                expect(mappingManagerSvc.getSourceOntologies).not.toHaveBeenCalled();
                expect(mappingManagerSvc.areCompatible).not.toHaveBeenCalled();
                expect(mappingManagerSvc.getAllClassMappings).not.toHaveBeenCalled();
                expect(mapperStateSvc.getClasses).not.toHaveBeenCalled();
                expect(controller.newMapping.jsonld).toEqual(newMapping);
                expect(mapperStateSvc.sourceOntologies).toEqual([]);
                expect(mapperStateSvc.availableClasses).toEqual([]);
                expect(mapperStateSvc.mapping).toEqual(controller.newMapping);
                expect(controller.newMapping.difference.additions).toEqual(newMapping);
                expect(mapperStateSvc.mappingSearchString).toBe('');
                expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);
                expect(mapperStateSvc.displayCreateMappingOverlay).toBe(false);
            });
            describe('if a copy of a mapping is being created', function() {
                var getDeferred,
                    ontologies = [{id: 'ontology'}],
                    sourceOntologyInfo = {},
                    originalJsonld = [{'@id': 'original'}],
                    copiedJsonld = [{'@id': 'copied'}];
                beforeEach(function() {
                    getDeferred = $q.defer();
                    mappingManagerSvc.getSourceOntologies.and.returnValue(getDeferred.promise);
                    controller.newMapping.jsonld = angular.copy(originalJsonld);
                    mappingManagerSvc.copyMapping.and.returnValue(copiedJsonld);
                    mappingManagerSvc.getSourceOntologyInfo.and.returnValue(sourceOntologyInfo);
                    mapperStateSvc.mappingSearchString = 'test';
                });
                it('unless getSourceOntologies is rejected', function() {
                    getDeferred.reject('Error message');
                    controller.continue();
                    scope.$apply();
                    expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newMapping.record.title);
                    expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.copyMapping).toHaveBeenCalledWith(originalJsonld, id);
                    expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(copiedJsonld);
                    expect(mappingManagerSvc.getSourceOntologies).toHaveBeenCalledWith(sourceOntologyInfo);
                    expect(mappingManagerSvc.areCompatible).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.getAllClassMappings).not.toHaveBeenCalled();
                    expect(mapperStateSvc.getClasses).not.toHaveBeenCalled();
                    expect(mapperStateSvc.sourceOntologies).not.toEqual(ontologies);
                    expect(mapperStateSvc.availableClasses).toEqual([]);
                    expect(mapperStateSvc.mappingSearchString).not.toBe('');
                    expect(mapperStateSvc.step).toBe(step);
                    expect(controller.errorMessage).toBe('Error retrieving mapping');
                    expect(controller.newMapping.jsonld).toEqual(copiedJsonld);
                    expect(mapperStateSvc.mapping).not.toEqual(controller.newMapping);
                    expect(mapperStateSvc.displayCreateMappingOverlay).toBe(true);
                });
                it('unless the source ontologies of the original mapping are not compatible', function() {
                    getDeferred.resolve(ontologies);
                    mappingManagerSvc.areCompatible.and.returnValue(false);
                    controller.continue();
                    scope.$apply();
                    expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newMapping.record.title);
                    expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.copyMapping).toHaveBeenCalledWith(originalJsonld, id);
                    expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(copiedJsonld);
                    expect(mappingManagerSvc.getSourceOntologies).toHaveBeenCalledWith(sourceOntologyInfo);
                    expect(mappingManagerSvc.areCompatible).toHaveBeenCalledWith(copiedJsonld, ontologies);
                    expect(mappingManagerSvc.getAllClassMappings).not.toHaveBeenCalled();
                    expect(mapperStateSvc.getClasses).not.toHaveBeenCalled();
                    expect(mapperStateSvc.sourceOntologies).not.toEqual(this.ontologies);
                    expect(mapperStateSvc.availableClasses).toEqual([]);
                    expect(mapperStateSvc.mappingSearchString).not.toBe('');
                    expect(mapperStateSvc.step).toBe(step);
                    expect(controller.errorMessage).toBe('The selected mapping is incompatible with its source ontologies');
                    expect(controller.newMapping.jsonld).toEqual(copiedJsonld);
                    expect(mapperStateSvc.mapping).not.toEqual(controller.newMapping);
                    expect(mapperStateSvc.displayCreateMappingOverlay).toBe(true);
                });
                it('successfully', function() {
                    getDeferred.resolve(ontologies);
                    mappingManagerSvc.getAllClassMappings.and.returnValue([{}]);
                    mappingManagerSvc.getClassIdByMapping.and.returnValue('test');
                    var unusedClass = {classObj: {'@id': ''}};
                    mapperStateSvc.getClasses.and.returnValue([{classObj: {'@id': 'test'}}, unusedClass]);
                    controller.continue();
                    scope.$apply();
                    expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newMapping.record.title);
                    expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.copyMapping).toHaveBeenCalledWith(originalJsonld, id);
                    expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(copiedJsonld);
                    expect(mappingManagerSvc.getSourceOntologies).toHaveBeenCalledWith(sourceOntologyInfo);
                    expect(mappingManagerSvc.areCompatible).toHaveBeenCalledWith(copiedJsonld, ontologies);
                    expect(mappingManagerSvc.getAllClassMappings).toHaveBeenCalledWith(copiedJsonld);
                    expect(mapperStateSvc.getClasses).toHaveBeenCalledWith(ontologies);
                    expect(mapperStateSvc.sourceOntologies).toEqual(ontologies);
                    expect(mapperStateSvc.availableClasses).toEqual([unusedClass]);
                    expect(mapperStateSvc.mappingSearchString).toBe('');
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);
                    expect(controller.errorMessage).toBe('');
                    expect(controller.newMapping.jsonld).toEqual(copiedJsonld);
                    expect(mapperStateSvc.mapping).toEqual(controller.newMapping);
                    expect(mapperStateSvc.displayCreateMappingOverlay).toBe(false);
                });
            });
        });
        it('should set the correct state for canceling', function() {
            controller.cancel();
            expect(mapperStateSvc.editMapping).toBe(false);
            expect(mapperStateSvc.newMapping).toBe(false);
            expect(mapperStateSvc.displayCreateMappingOverlay).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('create-mapping-overlay')).toBe(true);
            expect(element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a title field', function() {
            expect(element.querySelectorAll('input[name="title"]').length).toBe(1);
        });
        it('with a text-area', function() {
            expect(element.find('text-area').length).toBe(1);
        });
        it('with a keyword-select', function() {
            expect(element.find('keyword-select').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            expect(element.find('error-display').length).toBe(0);

            controller.errorMessage = 'test';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on the validity of the form', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            controller.newMapping.record.title = '';
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('with buttons to cancel and continue', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Continue']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Continue']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call continue when the button is clicked', function() {
        spyOn(controller, 'continue');
        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(controller.continue).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(controller, 'cancel');
        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        continueButton.triggerHandler('click');
        expect(controller.cancel).toHaveBeenCalled();
    });
});