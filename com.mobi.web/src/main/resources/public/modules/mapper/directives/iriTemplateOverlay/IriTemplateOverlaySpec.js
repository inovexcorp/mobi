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
describe('IRI Template Overlay directive', function() {
    var $compile, scope, element, controller, utilSvc, prefixes, mappingManagerSvc, mapperStateSvc, delimitedManagerSvc, utilSvc, classMapping,
        begin = 'http://test',
        then = '/',
        localName = '${0}';

    beforeEach(function() {
        module('templates');
        module('iriTemplateOverlay');
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

        mapperStateSvc.selectedClassMappingId = 'classMapping';
        classMapping = {
            '@id': mapperStateSvc.selectedClassMappingId,
            'hasPrefix': begin + then,
            'localName': localName
        };
        utilSvc.getPropertyValue.and.callFake(function(entity, iri) {
            if (iri === prefixes.delim + 'hasPrefix') {
                return classMapping.hasPrefix;
            } else if (iri === prefixes.delim + 'localName') {
                return classMapping.localName;
            }
        });
        mapperStateSvc.selectedClassMappingId = classMapping['@id'];
        mapperStateSvc.mapping = {jsonld: [classMapping]};
        delimitedManagerSvc.dataRows = [['a']];
        element = $compile(angular.element('<iri-template-overlay></iri-template-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('iriTemplateOverlay');
    });

    describe('should intialize with the correct values', function() {
        it('based on the selected class mapping id', function() {
            expect(controller.beginsWith).toBe(begin);
            expect(controller.then).toBe(then);
            var cleanOptions = _.forEach(controller.localNameOptions, function(opt) {
                delete opt['$$hashKey'];
            });
            expect(cleanOptions[0]).toEqual({text: 'UUID', value: '${UUID}'});
            expect(delimitedManagerSvc.getHeader.calls.count()).toBe(delimitedManagerSvc.dataRows[0].length);
            expect(cleanOptions).toContain({text: delimitedManagerSvc.getHeader(0), value: localName});
            expect(controller.endsWith).toEqual({text: delimitedManagerSvc.getHeader(0), value: localName});
        });
    });
    describe('controller methods', function() {
        it('should correctly set the iri template', function() {
            utilSvc.getPropertyValue.calls.reset();
            controller.set();
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(classMapping, prefixes.delim + 'hasPrefix');
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(classMapping, prefixes.delim + 'localName');
            expect(mappingManagerSvc.editIriTemplate).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.selectedClassMappingId,
                controller.beginsWith + controller.then, controller.endsWith.value);
            expect(mapperStateSvc.changeProp).toHaveBeenCalledWith(mapperStateSvc.selectedClassMappingId, prefixes.delim + 'hasPrefix', controller.beginsWith + controller.then, classMapping.hasPrefix);
            expect(mapperStateSvc.changeProp).toHaveBeenCalledWith(mapperStateSvc.selectedClassMappingId, prefixes.delim + 'localName', controller.endsWith.value, classMapping.localName);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('iri-template-overlay')).toBe(true);
            expect(element.querySelectorAll('form.content').length).toBe(1);
            expect(element.querySelectorAll('.template-begins-with').length).toBe(1);
            expect(element.querySelectorAll('.template-then').length).toBe(1);
            expect(element.querySelectorAll('.template-ends-with').length).toBe(1);
        });
        it('with a .help-block', function() {
            expect(element.querySelectorAll('.help-block').length).toBe(1);
        });
        it('with the correct classes for errors', function() {
            var failTests = ['/', '#', '?', 'test/', '/test', 'test#', '#test', 'test?', '?test', 't: test', 'test#test', 'test?test', 'test/test'];
            var successTests = ['t:test', 'test:/test', 'TEST:test', 't:test.test'];
            controller.beginsWith = '';
            scope.$digest();
            var beginsWith = angular.element(element.querySelectorAll('.template-begins-with')[0]);
            expect(beginsWith.hasClass('has-error')).toBe(true);

            failTests.forEach(function(test) {
                controller.beginsWith = test;
                scope.$digest();
                expect(beginsWith.hasClass('has-error')).toBe(true);
            });
            successTests.forEach(function(test) {
                controller.beginsWith = test;
                scope.$digest();
                expect(beginsWith.hasClass('has-error')).toBe(false);
            });
        });
        it('with the correct number of options for ends with', function() {
            var endsWith = angular.element(element.querySelectorAll('.template-ends-with select')[0]);
            expect(endsWith.find('option').length).toBe(controller.localNameOptions.length);
        });
        it('with buttons to cancel and set', function() {
            var buttons = element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});
