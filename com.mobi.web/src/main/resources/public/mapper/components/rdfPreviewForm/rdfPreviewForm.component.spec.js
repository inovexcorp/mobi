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
describe('RDF Preview Form component', function() {
    var $compile, scope, $q, delimitedManagerSvc, mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('mapper');
        mockComponent('mapper', 'mapperSerializationSelect');
        mockMapperState();
        mockDelimitedManager();

        inject(function(_$compile_, _$rootScope_, _delimitedManagerService_, _mapperStateService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            delimitedManagerSvc = _delimitedManagerService_;
            mapperStateSvc = _mapperStateService_;
            $q = _$q_;
        });

        mapperStateSvc.mapping = {jsonld: []};
        this.element = $compile(angular.element('<rdf-preview-form></rdf-preview-form>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('rdfPreviewForm');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        delimitedManagerSvc = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        describe('should generate an RDF preview', function() {
            it('unless an error occurs', function() {
                delimitedManagerSvc.previewMap.and.returnValue($q.reject('Error message'));
                this.controller.generatePreview();
                scope.$apply();
                expect(delimitedManagerSvc.previewMap).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.controller.serializeFormat);
                expect(delimitedManagerSvc.preview).toEqual('');
                expect(this.controller.errorMessage).toEqual('Error message');
            });
            describe('successfully', function() {
                beforeEach(function() {
                    this.preview = '';
                    delimitedManagerSvc.previewMap.and.returnValue($q.when(this.preview));
                });
                it('if format is JSON-LD', function() {
                    this.controller.serializeFormat = 'jsonld';
                    this.controller.generatePreview();
                    scope.$apply();
                    expect(delimitedManagerSvc.previewMap).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.controller.serializeFormat);
                    expect(this.controller.editorOptions.mode).toEqual('application/ld+json');
                    expect(delimitedManagerSvc.preview).toEqual(JSON.stringify(this.preview));
                });
                it('if format is turtle', function() {
                    this.controller.serializeFormat = 'turtle';
                    this.controller.generatePreview();
                    scope.$apply();
                    expect(delimitedManagerSvc.previewMap).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.controller.serializeFormat);
                    expect(this.controller.editorOptions.mode).toEqual('text/turtle');
                    expect(delimitedManagerSvc.preview).toEqual(this.preview);
                });
                it('if format is RDF/XML', function() {
                    this.controller.serializeFormat = 'rdf/xml';
                    this.controller.generatePreview();
                    scope.$apply();
                    expect(delimitedManagerSvc.previewMap).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.controller.serializeFormat);
                    expect(this.controller.editorOptions.mode).toEqual('application/xml');
                    expect(delimitedManagerSvc.preview).toEqual(this.preview);
                });
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('RDF-PREVIEW-FORM');
            expect(this.element.querySelectorAll('.rdf-preview-form').length).toEqual(1);
            expect(this.element.querySelectorAll('.select-container').length).toEqual(1);
            expect(this.element.querySelectorAll('.codemirror-wrapper').length).toEqual(1);
        });
        ['mapper-serialization-select', 'ui-codemirror'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('depending on whether an error has occured', function() {
            expect(this.element.find('error-display').length).toEqual(0);

            this.controller.errorMessage = 'Error message';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
    });
    it('should call generatePreview when the Refresh button is clicked', function() {
        spyOn(this.controller, 'generatePreview');
        angular.element(this.element.querySelectorAll('.select-container button')).triggerHandler('click');
        expect(this.controller.generatePreview).toHaveBeenCalled();
    });
});
