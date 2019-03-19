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
describe('IRI Template Overlay component', function() {
    var $compile, scope, utilSvc, prefixes, mappingManagerSvc, mapperStateSvc, delimitedManagerSvc;

    beforeEach(function() {
        module('templates');
        module('mapper');
        mockUtil();
        mockPrefixes();
        mockMapperState();
        mockMappingManager();
        mockDelimitedManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _utilService_, _prefixes_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
        });

        this.begin = 'http://test';
        this.then = '/';
        this.localName = '${0}';
        mapperStateSvc.selectedClassMappingId = 'classMapping';
        this.classMapping = {
            '@id': mapperStateSvc.selectedClassMappingId,
            hasPrefix: this.begin + this.then,
            localName: this.localName
        };
        utilSvc.getPropertyValue.and.callFake((entity, iri) => {
            if (iri === prefixes.delim + 'hasPrefix') {
                return this.classMapping.hasPrefix;
            } else if (iri === prefixes.delim + 'localName') {
                return this.classMapping.localName;
            }
        });
        mapperStateSvc.selectedClassMappingId = this.classMapping['@id'];
        mapperStateSvc.mapping = {jsonld: [this.classMapping]};
        delimitedManagerSvc.dataRows = [['a']];
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<iri-template-overlay close="close()" dismiss="dismiss()"></iri-template-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('iriTemplateOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        prefixes = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        delimitedManagerSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('should initialize with the correct values', function() {
        it('based on the selected class mapping id', function() {
            expect(this.controller.beginsWith).toBe(this.begin);
            expect(this.controller.then).toBe(this.then);
            var cleanOptions = _.forEach(this.controller.localNameOptions, opt => delete opt['$$hashKey']);
            expect(cleanOptions[0]).toEqual({text: 'UUID', value: '${UUID}'});
            expect(delimitedManagerSvc.getHeader.calls.count()).toBe(delimitedManagerSvc.dataRows[0].length);
            expect(cleanOptions).toContain({text: delimitedManagerSvc.getHeader(0), value: this.localName});
            expect(this.controller.endsWith).toEqual({text: delimitedManagerSvc.getHeader(0), value: this.localName});
        });
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
    describe('controller methods', function() {
        it('should correctly set the iri template', function() {
            utilSvc.getPropertyValue.calls.reset();
            this.controller.set();
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(this.classMapping, prefixes.delim + 'hasPrefix');
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(this.classMapping, prefixes.delim + 'localName');
            expect(mappingManagerSvc.editIriTemplate).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.selectedClassMappingId, this.controller.beginsWith + this.controller.then, this.controller.endsWith.value);
            expect(mapperStateSvc.changeProp).toHaveBeenCalledWith(mapperStateSvc.selectedClassMappingId, prefixes.delim + 'hasPrefix', this.controller.beginsWith + this.controller.then, this.classMapping.hasPrefix);
            expect(mapperStateSvc.changeProp).toHaveBeenCalledWith(mapperStateSvc.selectedClassMappingId, prefixes.delim + 'localName', this.controller.endsWith.value, this.classMapping.localName);
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('IRI-TEMPLATE-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        ['.template-begins-with', '.template-then', '.template-ends-with', '.form-text'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.querySelectorAll(test).length).toBe(1);
            });
        });
        it('with the correct classes for errors', function() {
            var failTests = ['/', '#', '?', 'test/', '/test', 'test#', '#test', 'test?', '?test', 't: test', 'test#test', 'test?test', 'test/test'];
            var successTests = ['t:test', 'test:/test', 'TEST:test', 't:test.test'];
            this.controller.beginsWith = '';
            scope.$digest();
            var beginsWith = angular.element(this.element.querySelectorAll('.template-begins-with input')[0]);
            expect(beginsWith.hasClass('is-invalid')).toBe(true);

            failTests.forEach(test => {
                this.controller.beginsWith = test;
                scope.$digest();
                expect(beginsWith.hasClass('is-invalid')).toBe(true);
            });
            successTests.forEach(test => {
                this.controller.beginsWith = test;
                scope.$digest();
                expect(beginsWith.hasClass('is-invalid')).toBe(false);
            });
        });
        it('with the correct number of options for ends with', function() {
            var endsWith = angular.element(this.element.querySelectorAll('.template-ends-with select')[0]);
            expect(endsWith.find('option').length).toBe(this.controller.localNameOptions.length);
        });
        it('with buttons to cancel and submit', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});
