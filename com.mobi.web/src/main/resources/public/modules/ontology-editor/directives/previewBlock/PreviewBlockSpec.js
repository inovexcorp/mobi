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
describe('Preview Block directive', function() {
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('previewBlock');
        mockOntologyState();
        mockOntologyManager();

        module(function($provide) {
            $provide.value('jsonFilter', function() {
                return 'json';
            });
        });

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        this.element = $compile(angular.element('<preview-block></preview-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('previewBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('preview-block')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a .preview-content', function() {
            expect(this.element.querySelectorAll('.preview-content').length).toBe(1);
        });
        it('with a serialization-select', function() {
            expect(this.element.find('serialization-select').length).toBe(1);
        });
        it('depending on whether a preview is generated', function() {
            expect(this.element.find('ui-codemirror').length).toBe(0);

            this.controller.activePage = {preview: 'test'};
            scope.$digest();
            expect(this.element.find('ui-codemirror').length).toBe(1);
        });
        it('depending on whether a serialization whas selected', function() {
            var button = this.element.find('button');
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.activePage = {serialization: 'test'};
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('should get a preview', function() {
            it('if the format is JSON-LD', function() {
                this.controller.activePage = {serialization: 'jsonld'};
                this.controller.getPreview();
                scope.$apply();
                expect(this.controller.activePage.mode).toBe('application/ld+json');
                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, 'jsonld', false, true);
                expect(this.controller.activePage.preview).toEqual('json');
            });
            it('if the format is not JSON-LD', function() {
                [
                    {
                        serialization: 'turtle',
                        mode: 'text/turtle'
                    },
                    {
                        serialization: 'rdf/xml',
                        mode: 'application/xml'
                    }
                ].forEach(function(test) {
                    this.controller.activePage = {serialization: test.serialization};
                    this.controller.getPreview();
                    scope.$apply();
                    expect(this.controller.activePage.mode).toBe(test.mode);
                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, test.serialization, false, true);
                    expect(this.controller.activePage.preview).toEqual({});
                }.bind(this));
            });
        });
    });
    it('should call getPreview when the button is clicked', function() {
        spyOn(this.controller, 'getPreview');
        var button = this.element.find('button');
        button.triggerHandler('click');
        expect(this.controller.getPreview).toHaveBeenCalled();
    });
});