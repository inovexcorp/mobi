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
describe('IRI Template Overlay directive', function() {
    var $compile,
        scope,
        prefixes,
        mappingManagerSvc,
        mapperStateSvc,
        csvManagerSvc;

    beforeEach(function() {
        module('templates');
        module('iriTemplateOverlay');
        mockPrefixes();
        mockMapperState();
        mockMappingManager();
        mockCsvManager();

        inject(function(_mappingManagerService_, _mapperStateService_, _csvManagerService_) {
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            csvManagerSvc = _csvManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('should intialize with the correct values', function() {
        it('based on the selected class mapping id', function() {
            var begin = '/test';
            var then = '/';
            var localName = '${0}';
            var classMapping = {
                '@id': mapperStateSvc.selectedClassMappingId,
                'hasPrefix': [{'@value': begin + then}],
                'localName': [{'@value': localName}]
            };
            mapperStateSvc.selectedClassMappingId = classMapping['@id'];
            mappingManagerSvc.mapping = {
                jsonld: [classMapping]
            };
            csvManagerSvc.filePreview = {headers: ['a']};
            var element = $compile(angular.element('<iri-template-overlay></iri-template-overlay>'))(scope);
            scope.$digest();
            var controller = element.controller('iriTemplateOverlay');
            expect(controller.beginning).toBe('/');
            expect(controller.beginsWith).toBe('test');
            expect(controller.then).toBe('/');
            var cleanOptions = _.forEach(controller.localNameOptions, function(opt) {
                delete opt['$$hashKey'];
            });
            expect(cleanOptions[0]).toEqual({text: 'UUID', value: '${UUID}'});
            expect(cleanOptions).toContain({text: csvManagerSvc.filePreview.headers[0], value: localName});
            expect(controller.endsWith).toEqual({text: csvManagerSvc.filePreview.headers[0], value: localName});
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            csvManagerSvc.filePreview = {headers: []};
            this.element = $compile(angular.element('<iri-template-overlay></iri-template-overlay>'))(scope);
            scope.$digest();
        });
        it('should correctly set the iri template', function() {
            var controller = this.element.controller('iriTemplateOverlay');
            controller.set();
            expect(mappingManagerSvc.editIriTemplate).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.selectedClassMappingId, 
                controller.beginsWith + controller.then, controller.endsWith.value);
            expect(mapperStateSvc.changedMapping).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            csvManagerSvc.filePreview = {headers: []};
            this.element = $compile(angular.element('<iri-template-overlay></iri-template-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('iri-template-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
            expect(this.element.querySelectorAll('.template-begins-with').length).toBe(1);
            expect(this.element.querySelectorAll('.template-then').length).toBe(1);
            expect(this.element.querySelectorAll('.template-ends-with').length).toBe(1);
        });
        it('with the correct classes for errors', function() {
            var failTests = ['/', '#', '?', ':', 'test/', '/test', 'test#', '#test', 'test?', '?test', 'test:', ':test', 'test#test', 'test?test', 'test:test'];
            var successTests = ['test', 'test/test', 'TEST_test', 'test.test'];
            var controller = this.element.controller('iriTemplateOverlay');
            var beginsWith = angular.element(this.element.querySelectorAll('.template-begins-with')[0]);
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
            var controller = this.element.controller('iriTemplateOverlay');
            var endsWith = angular.element(this.element.querySelectorAll('.template-ends-with select')[0]);
            expect(endsWith.find('option').length).toBe(controller.localNameOptions.length);
        });
        it('with custom buttons to cancel and set', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});