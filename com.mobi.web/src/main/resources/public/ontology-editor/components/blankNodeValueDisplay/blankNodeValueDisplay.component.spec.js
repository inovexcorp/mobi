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
describe('Blank Node Value Display component', function() {
    var $compile, scope, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        ontoUtils.getBlankNodeValue.and.returnValue('bnode');
        scope.nodeId = 'id';
        this.element = $compile(angular.element('<blank-node-value-display node-id="nodeId"></blank-node-value-display>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('blankNodeValueDisplay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontoUtils = null;
    });

    it('initializes value correctly', function() {
        var controller = this.element.controller('blankNodeValueDisplay');
        expect(controller.value).toEqual('bnode');
        expect(ontoUtils.getBlankNodeValue).toHaveBeenCalledWith(scope.nodeId);
    });
    describe('controller bound variable', function() {
        it('nodeId should be one way bound', function() {
            this.controller.nodeId = 'different';
            scope.$digest();
            expect(scope.nodeId).toEqual('id');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('BLANK-NODE-VALUE-DISPLAY');
            expect(this.element.querySelectorAll('.blank-node-value-display').length).toEqual(1);
        });
        it('with a ui-codemirror', function() {
            expect(this.element.find('ui-codemirror').length).toEqual(1);
        });
    });
});