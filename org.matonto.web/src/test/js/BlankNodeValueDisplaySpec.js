/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
describe('Blank Node Value Display directive', function() {
    var $compile, scope, element, isolatedScope, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('blankNodeValueDisplay');
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        ontoUtils.getBlankNodeValue.and.returnValue('bnode');
        scope.nodeId = 'id';
        element = $compile(angular.element('<blank-node-value-display node-id="nodeId"></blank-node-value-display>'))(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
        controller = element.controller('blankNodeValueDisplay');
    });

    it('initializes value correctly', function() {
        expect(controller.value).toEqual('bnode');
        expect(ontoUtils.getBlankNodeValue).toHaveBeenCalledWith(scope.nodeId);
    });
    describe('in isolated scope', function() {
        it('nodeId should be one way bound', function() {
            isolatedScope.nodeId = 'different';
            scope.$digest();
            expect(scope.nodeId).toEqual('id');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('blank-node-value-display')).toBe(true);
        });
        it('with a ui-codemirror', function() {
            expect(element.find('ui-codemirror').length).toEqual(1);
        });
    });
});