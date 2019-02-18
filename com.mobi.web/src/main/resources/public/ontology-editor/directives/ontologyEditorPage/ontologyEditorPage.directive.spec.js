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
describe('Ontology Editor Page directive', function() {
    var $compile, scope, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyEditorPage');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.element = $compile(angular.element('<ontology-editor-page></ontology-editor-page>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('ontologyEditorPage');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('DIV');
            expect(this.element.hasClass('ontology-editor-page')).toEqual(true);
        });
        it('with a ontology-sidebar', function() {
            expect(this.element.find('ontology-sidebar').length).toEqual(1);
        });
        it('depending on whether an ontology is selected', function() {
            spyOn(this.controller, 'isOpenTab').and.returnValue(true);
            scope.$digest();
            expect(this.element.find('open-ontology-tab').length).toEqual(1);
            expect(this.element.find('ontology-tab').length).toEqual(0);

            this.controller.isOpenTab.and.returnValue(false);
            scope.$digest();
            expect(this.element.find('open-ontology-tab').length).toEqual(0);
            expect(this.element.find('ontology-tab').length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('should test whether the open ontology tab should be shown', function() {
            expect(this.controller.isOpenTab()).toEqual(false);
            ontologyStateSvc.listItem = {};
            expect(this.controller.isOpenTab()).toEqual(true);
        });
    });
});