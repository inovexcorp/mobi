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
fdescribe('Merge Tab component', function() {
    var $compile, scope, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockComponent('ontology-editor', 'mergeBlock');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        ontologyStateSvc.listItem.merge.conflicts = [];
        this.element = $compile(angular.element('<merge-tab></merge-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MERGE-TAB');
            expect(this.element.querySelectorAll('.merge-tab').length).toEqual(1);
        });
        it('depending on whether there are conflicts', function() {
            console.log(this.controller);
            
            expect(this.element.find('merge-block').length).toEqual(1);
            expect(this.element.find('resolve-conflicts-block').length).toEqual(0);

            ontologyStateSvc.listItem.merge.conflicts = [{}];
            scope.$digest();
            expect(this.element.find('merge-block').length).toEqual(0);
            expect(this.element.find('resolve-conflicts-block').length).toEqual(1);
        });
    });
});
