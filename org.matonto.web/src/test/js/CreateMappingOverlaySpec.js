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
/*describe('Create Mapping Overlay directive', function() {
    var $compile,
        scope,
        mappingManagerSvc,
        mapperStateSvc,
        $q,
        $timeout,
        controller;

    beforeEach(function() {
        module('templates');
        module('createMappingOverlay');
        mockMappingManager();
        mockMapperState();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_, _$q_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            $q = _$q_;
            $timeout = _$timeout_;
        });
    });

    describe('should initialize with the correct values', function() {
        it('for the selected saved mapping id', function() {
            mappingManagerSvc.mappingIds = ['mapping'];
            var element = $compile(angular.element('<create-mapping-overlay></create-mapping-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('createMappingOverlay');
            expect(controller.savedMappingId).toBe(mappingManagerSvc.mappingIds[0]);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mappingIds = [''];
            this.element = $compile(angular.element('<create-mapping-overlay></create-mapping-overlay>'))(scope);
            scope.$digest();
            controller = this.element.controller('createMappingOverlay');
        });
        describe('should set the correct state for continuing', function() {
            beforeEach(function() {
                mapperStateSvc.mapping = {id: 'mapping'};
                controller.savedMappingId = '';
                this.ontologies = [{}];
                mappingManagerSvc.getSourceOntologies.and.returnValue(this.ontologies);
            });
            it('if a brand new mapping is being created', function() {
                var ontologies = [];
                controller.mappingType = 'new';
                controller.continue();
                $timeout.flush();
                expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newName);
                expect(mappingManagerSvc.createNewMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.id);
                expect(mappingManagerSvc.getMapping).not.toHaveBeenCalled();
                expect(mappingManagerSvc.copyMapping).not.toHaveBeenCalled();
                expect(mapperStateSvc.mappingSearchString).toBe('');
                expect(mapperStateSvc.mapping.jsonld).toBeDefined();
                expect(mappingManagerSvc.getSourceOntologies).toHaveBeenCalled();
                expect(mapperStateSvc.sourceOntologies).toEqual(this.ontologies);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);
                expect(mapperStateSvc.displayCreateMappingOverlay).toBe(false);
            });
            describe('if a copy of a mapping is being created', function() {
                beforeEach(function() {
                    controller.mappingType = 'saved';
                    this.savedMappingId = controller.savedMappingId;
                });
                it('unless an error occurs', function() {
                    mappingManagerSvc.getMapping.and.returnValue($q.reject('Error message'));
                    controller.continue();
                    $timeout.flush();
                    expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newName);
                    expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith(this.savedMappingId);
                    expect(mappingManagerSvc.copyMapping).not.toHaveBeenCalled();
                    expect(mapperStateSvc.step).not.toBe(mapperStateSvc.fileUploadStep);
                    expect(mappingManagerSvc.getSourceOntologies).not.toHaveBeenCalled();
                    expect(controller.errorMessage).toBe('Error message');
                    expect(mapperStateSvc.mapping.jsonld).toEqual([]);
                });
                it('unless the source ontologies of the original mapping are not compatible', function() {
                    mappingManagerSvc.areCompatible.and.returnValue(false);
                    controller.continue();
                    $timeout.flush();
                    expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newName);
                    expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith(this.savedMappingId);
                    expect(mappingManagerSvc.copyMapping).toHaveBeenCalled();
                    expect(mappingManagerSvc.getSourceOntologies).toHaveBeenCalled();
                    expect(mapperStateSvc.sourceOntologies).not.toEqual(this.ontologies);
                    expect(mapperStateSvc.step).not.toBe(mapperStateSvc.fileUploadStep);
                    expect(controller.errorMessage).toBeTruthy();
                    expect(mapperStateSvc.mapping.jsonld).toEqual([]);
                });
                it('successfully', function() {
                    var mapping = {};
                    mappingManagerSvc.getMapping.and.returnValue($q.when(mapping));
                    controller.continue();
                    $timeout.flush();
                    expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newName);
                    expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith(this.savedMappingId);
                    expect(mappingManagerSvc.copyMapping).toHaveBeenCalledWith(mapping, mapperStateSvc.mapping.id);
                    expect(mapperStateSvc.mapping.jsonld).toBeDefined();
                    expect(mappingManagerSvc.getSourceOntologies).toHaveBeenCalled();
                    expect(mapperStateSvc.sourceOntologies).toEqual(this.ontologies);
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
        beforeEach(function() {
            this.element = $compile(angular.element('<create-mapping-overlay></create-mapping-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('create-mapping-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a mapping name input', function() {
            expect(this.element.find('mapping-name-input').length).toBe(1);
        });
        it('with two radio buttons', function() {
            expect(this.element.find('radio-button').length).toBe(2);
        });
        it('depending on whether an error has occured', function() {
            controller = this.element.controller('createMappingOverlay');
            expect(this.element.find('error-display').length).toBe(0);

            controller.errorMessage = 'test';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on how many saved mappings there are', function() {
            mappingManagerSvc.mappingIds = [];
            scope.$digest();
            var select = this.element.find('select');
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
            controller = this.element.controller('createMappingOverlay');
            controller.mappingType = 'new';
            scope.$digest();
            var select = this.element.find('select');
            expect(select.attr('required')).toBeFalsy();

            controller.mappingType = 'saved';
            scope.$digest();
            expect(select.attr('required')).toBeTruthy();
        });
        it('depending on the validity of the form', function() {
            controller = this.element.controller('createMappingOverlay');
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            controller.createMappingForm.$setValidity('test', false);
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
    it('should change the mapping type being created if the saved mapping list is focused on', function() {
        var element = $compile(angular.element('<create-mapping-overlay></create-mapping-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('createMappingOverlay');

        element.find('select').triggerHandler('focus');
        expect(controller.mappingType).toBe('saved');
    });
    it('should call continue when the button is clicked', function() {
        var element = $compile(angular.element('<create-mapping-overlay></create-mapping-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('createMappingOverlay');
        spyOn(controller, 'continue');

        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(controller.continue).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        var element = $compile(angular.element('<create-mapping-overlay></create-mapping-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('createMappingOverlay');
        spyOn(controller, 'cancel');

        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        continueButton.triggerHandler('click');
        expect(controller.cancel).toHaveBeenCalled();
    });
});*/