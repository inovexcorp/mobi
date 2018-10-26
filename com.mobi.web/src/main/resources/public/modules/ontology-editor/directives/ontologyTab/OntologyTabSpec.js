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
describe('Ontology Tab directive', function() {
    var $compile, scope, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyTab');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.element = $compile(angular.element('<ontology-tab></ontology-tab>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('ontology-tab')).toBe(true);
        });
        it('with a material-tabset', function() {
            expect(this.element.find('material-tabset').length).toBe(1);
        });
        it('with mateiral-tabs', function() {
            expect(this.element.find('material-tab').length).toBe(10);
        });
        ['ontology-button-stack', 'project-tab', 'overview-tab', 'classes-tab', 'properties-tab', 'individuals-tab', 'concepts-tab', 'concept-schemes-tab', 'search-tab', 'saved-changes-tab', 'commits-tab'].forEach(function(tag) {
            it('with a ' + tag, function() {
                expect(this.element.find(tag).length).toBe(1);
            });
        }, this);
        it('if branches are being merged', function() {
            expect(this.element.find('merge-tab').length).toBe(0);

            ontologyStateSvc.listItem.merge.active = true;
            scope.$digest();
            expect(this.element.find('material-tabset').length).toBe(0);
            expect(this.element.find('ontology-button-stack').length).toBe(0);
            expect(this.element.find('merge-tab').length).toBe(1);
        });
    });
});