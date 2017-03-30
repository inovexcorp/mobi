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
describe('Create Mapping Overlay directive', function() {
    var $compile,
        scope,
        element,
        controller,
        $q,
        mappingManagerSvc,
        mapperStateSvc,
        catalogManagerSvc,
        prefixes;

    beforeEach(function() {
        module('templates');
        module('createMappingOverlay');
        injectSplitIRIFilter();
        mockMappingManager();
        mockMapperState();
        mockPrefixes();
        mockCatalogManager();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_, _catalogManagerService_, _prefixes_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            prefixes = _prefixes_;
            $q = _$q_;
        });

        mappingManagerSvc.mappingIds = [''];
        element = $compile(angular.element('<create-mapping-overlay></create-mapping-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('createMappingOverlay');
    });

    describe('should initialize with the correct values', function() {
        it('for the selected saved mapping id', function() {
            expect(controller.savedMappingId).toBe(mappingManagerSvc.mappingIds[0]);
        });
    });
    describe('controller methods', function() {
        describe('should set the correct state for continuing', function() {
            beforeEach(function() {
                mapperStateSvc.mapping = {id: 'mapping'};
                controller.savedMappingId = '';
                this.ontologies = [{}];
                mappingManagerSvc.getSourceOntologies.and.returnValue(this.ontologies);
                mapperStateSvc.displayCreateMappingOverlay = true;
            });
            it('if a brand new mapping is being created', function() {
                var ontologies = [];
                controller.mappingType = 'new';
                controller.continue();
                scope.$apply();
                expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newName);
                expect(mappingManagerSvc.createNewMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.id);
                expect(mappingManagerSvc.getMapping).not.toHaveBeenCalled();
                expect(mappingManagerSvc.copyMapping).not.toHaveBeenCalled();
                expect(catalogManagerSvc.getRecord).not.toHaveBeenCalled();
                expect(mapperStateSvc.mappingSearchString).toBe('');
                expect(mapperStateSvc.mapping.jsonld).toBeDefined();
                expect(mappingManagerSvc.getSourceOntologies).toHaveBeenCalledWith(jasmine.any(Object));
                expect(mapperStateSvc.sourceOntologies).toEqual(this.ontologies);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);
                expect(mapperStateSvc.displayCreateMappingOverlay).toBe(false);
            });
            describe('if a copy of a mapping is being created', function() {
                beforeEach(function() {
                    controller.mappingType = 'saved';
                    this.savedMappingId = controller.savedMappingId;
                    this.record = {
                        '@id': 'record',
                        '@type': []
                    };
                    this.record[prefixes.dcterms + 'title'] = [{'@value': ''}];
                    this.record[prefixes.dcterms + 'description'] = [{'@value': ''}];
                    this.record[prefixes.dcterms + 'issued'] = [{'@value': ''}];
                    this.record[prefixes.dcterms + 'modified'] = [{'@value': ''}];
                    this.record[prefixes.catalog + 'keyword'] = [{'@value': ''}];
                    mappingManagerSvc.getSourceOntologyInfo.and.returnValue({recordId: this.record['@id']});
                    catalogManagerSvc.getRecord.and.returnValue($q.when(this.record));
                    catalogManagerSvc.localCatalog = {'@id': ''};
                    mapperStateSvc.mappingSearchString = 'test';
                });
                it('unless an error occurs', function() {
                    mappingManagerSvc.getMapping.and.returnValue($q.reject('Error message'));
                    controller.continue();
                    scope.$apply();
                    expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newName);
                    expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith(this.savedMappingId);
                    expect(mappingManagerSvc.copyMapping).not.toHaveBeenCalled();
                    expect(catalogManagerSvc.getRecord).not.toHaveBeenCalled();
                    expect(mapperStateSvc.step).not.toBe(mapperStateSvc.fileUploadStep);
                    expect(mappingManagerSvc.getSourceOntologies).not.toHaveBeenCalled();
                    expect(mapperStateSvc.sourceOntologies).not.toEqual(this.ontologies);
                    expect(mapperStateSvc.availableClasses).toEqual([]);
                    expect(mapperStateSvc.mappingSearchString).not.toBe('');
                    expect(mapperStateSvc.step).not.toBe(mapperStateSvc.fileUploadStep);
                    expect(controller.errorMessage).toBe('Error message');
                    expect(mapperStateSvc.mapping.jsonld).toEqual([]);
                    expect(mapperStateSvc.mapping.record).toBeUndefined();
                    expect(mapperStateSvc.displayCreateMappingOverlay).toBe(true);
                });
                it('unless the source ontologies of the original mapping are not compatible', function() {
                    mappingManagerSvc.areCompatible.and.returnValue(false);
                    controller.continue();
                    scope.$apply();
                    expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newName);
                    expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith(this.savedMappingId);
                    expect(mappingManagerSvc.copyMapping).toHaveBeenCalled();
                    expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith(this.record['@id'], catalogManagerSvc.localCatalog['@id']);
                    expect(mappingManagerSvc.getSourceOntologies).toHaveBeenCalledWith(jasmine.any(Object));
                    expect(mapperStateSvc.sourceOntologies).not.toEqual(this.ontologies);
                    expect(mapperStateSvc.availableClasses).toEqual([]);
                    expect(mapperStateSvc.mappingSearchString).not.toBe('');
                    expect(mapperStateSvc.step).not.toBe(mapperStateSvc.fileUploadStep);
                    expect(controller.errorMessage).toBeTruthy();
                    expect(mapperStateSvc.mapping.jsonld).toEqual([]);
                    expect(mapperStateSvc.mapping.record).toBeUndefined();
                    expect(mapperStateSvc.displayCreateMappingOverlay).toBe(true);
                });
                it('successfully', function() {
                    var mapping = {};
                    mappingManagerSvc.getMapping.and.returnValue($q.when(mapping));
                    mappingManagerSvc.getAllClassMappings.and.returnValue([{}]);
                    mappingManagerSvc.getClassIdByMapping.and.returnValue('test');
                    mapperStateSvc.getClasses.and.returnValue([{classObj: {'@id': 'test'}}, {classObj: {'@id': ''}}]);
                    controller.continue();
                    scope.$apply();
                    expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newName);
                    expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith(this.savedMappingId);
                    expect(mappingManagerSvc.copyMapping).toHaveBeenCalledWith(mapping, mapperStateSvc.mapping.id);
                    expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith(this.record['@id'], catalogManagerSvc.localCatalog['@id']);
                    expect(mapperStateSvc.mapping.jsonld).toBeDefined();
                    expect(mapperStateSvc.mapping.record).toEqual(this.record);
                    expect(mappingManagerSvc.getSourceOntologies).toHaveBeenCalledWith(jasmine.any(Object));
                    expect(mapperStateSvc.sourceOntologies).toEqual(this.ontologies);
                    expect(mapperStateSvc.availableClasses).toEqual([{classObj: {'@id': ''}}]);
                    expect(mapperStateSvc.mappingSearchString).toBe('');
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);
                    expect(mapperStateSvc.displayCreateMappingOverlay).toBe(false);
                });
            });
        });
        it('should set the correct state for canceling', function() {
            controller.cancel();
            expect(mapperStateSvc.editMapping).toBe(false);
            expect(mapperStateSvc.newMapping).toBe(false);
            expect(mapperStateSvc.mapping).toBeUndefined();
            expect(mapperStateSvc.displayCreateMappingOverlay).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('create-mapping-overlay')).toBe(true);
            expect(element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a mapping name input', function() {
            expect(element.find('mapping-name-input').length).toBe(1);
        });
        it('with two radio buttons', function() {
            expect(element.find('radio-button').length).toBe(2);
        });
        it('depending on whether an error has occured', function() {
            expect(element.find('error-display').length).toBe(0);

            controller.errorMessage = 'test';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on how many saved mappings there are', function() {
            mappingManagerSvc.mappingIds = [];
            scope.$digest();
            var select = element.find('select');
            var options = select.querySelectorAll('option');
            expect(select.attr('disabled')).toBeTruthy();
            expect(options.length).toBe(1);
            expect(angular.element(options[0]).hasClass('no-values')).toBe(true);

            mappingManagerSvc.mappingIds = [''];
            scope.$digest();
            var options = select.querySelectorAll('option');
            expect(select.attr('disabled')).toBeFalsy();
            expect(options.length).toBe(mappingManagerSvc.mappingIds.length);
        });
        it('depending on the mapping type being created', function() {
            controller.mappingType = 'new';
            scope.$digest();
            var select = element.find('select');
            expect(select.attr('required')).toBeFalsy();

            controller.mappingType = 'saved';
            scope.$digest();
            expect(select.attr('required')).toBeTruthy();
        });
        it('depending on the validity of the form', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            controller.createMappingForm.$setValidity('test', false);
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
    it('should change the mapping type being created if the saved mapping list is focused on', function() {
        element.find('select').triggerHandler('focus');
        expect(controller.mappingType).toBe('saved');
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