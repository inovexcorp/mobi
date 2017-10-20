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
describe('Entity Description directive', function() {
    var $compile,
        scope,
        element,
        isolatedScope,
        controller,
        utilSvc,
        $filter;

    beforeEach(function() {
        module('templates');
        module('entityDescription');
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _utilService_, _$filter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            $filter = _$filter_;
        });

        scope.entity = {};
        scope.limited = true;
        element = $compile(angular.element('<entity-description entity="entity" limited="limited"></entity-description>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('entity should be one way bound', function() {
            isolatedScope.entity = {a: 'b'};
            scope.$digest();
            expect(scope.entity).toEqual({});
        });
    });
    describe('controller bound variable', function() {
        beforeEach(function() {
            controller = element.controller('entityDescription');
        });
        it('limited should be one way bound', function() {
            controller.limited = false;
            scope.$digest();
            expect(scope.limited).toBe(true);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('entityDescription');
        });
        describe('should get the limited description of the entity', function() {
            beforeEach(function() {
                controller.descriptionLimit = 10;
            });
            it('depending on whether the full description should be shown', function() {
                var description = 'AAAAAAAAAAAAAAA';
                spyOn(controller, 'getDescription').and.returnValue(description);
                controller.full = false;
                var result = controller.getLimitedDescription();
                expect(result.length).toBe(controller.descriptionLimit + 3);
                expect(_.endsWith(result, '...')).toBe(true);

                controller.full = true;
                result = controller.getLimitedDescription();
                expect(result.length).toBe(description.length);
                expect(_.endsWith(result, '...')).toBe(false);
            });
            it('depending on the length of the description', function() {
                var description = 'AAAAA';
                controller.full = false;
                spyOn(controller, 'getDescription').and.returnValue(description);
                var result = controller.getLimitedDescription();
                expect(result.length).toBe(description.length);
                expect(_.endsWith(result, '...')).toBe(false);

                controller.getDescription.and.returnValue('AAAAAAAAAAAAAAA');
                result = controller.getLimitedDescription();
                expect(result.length).toBe(controller.descriptionLimit + 3);
                expect(_.endsWith(result, '...')).toBe(true);
            });
        });
        it('should get the entity description', function() {
            var description = 'AAAAA';
            utilSvc.getDctermsValue.and.returnValue(description);
            expect(controller.getDescription()).toBe(description);
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(controller.entity, 'description');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            controller = element.controller('entityDescription');
        });
        it('for wrapping containers', function() {
            expect(element.hasClass('entity-description')).toBe(true);
        });
        it('depending on whether there is a description', function() {
            var p = element.find('p');
            expect(p.text()).toContain('(None Specified)');

            spyOn(controller, 'getDescription').and.returnValue('test');
            scope.$digest();
            var p = element.find('p');
            expect(p.text()).not.toContain('(None Specified)');
        });
        it('depending on whether the description should be limited', function() {
            controller.descriptionLimit = 1;
            spyOn(controller, 'getDescription').and.returnValue('full');
            spyOn(controller, 'getLimitedDescription').and.returnValue('limited');
            scope.$digest();
            var p = element.find('p');
            expect(p.text()).toContain('limited');
            expect(p.find('a').length).toBe(1);

            scope.limited = false;
            scope.$digest();
            expect(p.text()).toContain('full');
            expect(p.find('a').length).toBe(0);
        });
        it('depending on whether the description is longer than the limit', function() {
            controller.descriptionLimit = 10;
            spyOn(controller, 'getDescription').and.returnValue('AAAAA');
            scope.$digest();
            expect(element.find('a').length).toBe(0);

            controller.getDescription.and.returnValue('AAAAAAAAAAAAAAA');
            scope.$digest();
            expect(element.find('a').length).toBe(1);
        });
        it('depending on whether the full description should be shown', function() {
            controller.descriptionLimit = 10;
            spyOn(controller, 'getDescription').and.returnValue('AAAAAAAAAAAAAAA');
            controller.full = false;
            scope.$digest();
            var a = element.find('a');
            expect(a.text()).toBe('Show more');

            controller.full = true;
            scope.$digest();
            expect(a.text()).toBe('Show less');
        });
    });
    it('should toggle full when the Show link is clicked', function() {
        controller = element.controller('entityDescription');
        controller.descriptionLimit = 10;
        spyOn(controller, 'getDescription').and.returnValue('AAAAAAAAAAAAAAA');
        scope.$digest();

        var link = element.find('a');
        link.triggerHandler('click');
        expect(controller.full).toBe(true);
    });
});