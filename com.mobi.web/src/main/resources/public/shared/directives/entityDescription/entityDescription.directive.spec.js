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
describe('Entity Description directive', function() {
    var $compile, scope, utilSvc, $filter;

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
        this.element = $compile(angular.element('<entity-description entity="entity" limited="limited"></entity-description>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('entityDescription');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        $filter = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('entity should be one way bound', function() {
            this.isolatedScope.entity = {a: 'b'};
            scope.$digest();
            expect(scope.entity).toEqual({});
        });
    });
    describe('controller bound variable', function() {
        it('limited should be one way bound', function() {
            this.controller.limited = false;
            scope.$digest();
            expect(scope.limited).toBe(true);
        });
    });
    describe('controller methods', function() {
        describe('should get the limited description of the entity', function() {
            beforeEach(function() {
                this.controller.descriptionLimit = 10;
            });
            it('depending on whether the full description should be shown', function() {
                var description = 'AAAAAAAAAAAAAAA';
                spyOn(this.controller, 'getDescription').and.returnValue(description);
                this.controller.full = false;
                var result = this.controller.getLimitedDescription();
                expect(result.length).toBe(this.controller.descriptionLimit + 3);
                expect(_.endsWith(result, '...')).toBe(true);

                this.controller.full = true;
                result = this.controller.getLimitedDescription();
                expect(result.length).toBe(description.length);
                expect(_.endsWith(result, '...')).toBe(false);
            });
            it('depending on the length of the description', function() {
                var description = 'AAAAA';
                this.controller.full = false;
                spyOn(this.controller, 'getDescription').and.returnValue(description);
                var result = this.controller.getLimitedDescription();
                expect(result.length).toBe(description.length);
                expect(_.endsWith(result, '...')).toBe(false);

                this.controller.getDescription.and.returnValue('AAAAAAAAAAAAAAA');
                result = this.controller.getLimitedDescription();
                expect(result.length).toBe(this.controller.descriptionLimit + 3);
                expect(_.endsWith(result, '...')).toBe(true);
            });
        });
        it('should get the entity description', function() {
            var description = 'AAAAA';
            utilSvc.getDctermsValue.and.returnValue(description);
            expect(this.controller.getDescription()).toBe(description);
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(this.controller.entity, 'description');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('entity-description')).toBe(true);
        });
        it('depending on whether there is a description', function() {
            var p = this.element.find('p');
            expect(p.text()).toContain('(None Specified)');

            spyOn(this.controller, 'getDescription').and.returnValue('test');
            scope.$digest();
            var p = this.element.find('p');
            expect(p.text()).not.toContain('(None Specified)');
        });
        it('depending on whether the description should be limited', function() {
            this.controller.descriptionLimit = 1;
            spyOn(this.controller, 'getDescription').and.returnValue('full');
            spyOn(this.controller, 'getLimitedDescription').and.returnValue('limited');
            scope.$digest();
            var p = this.element.find('p');
            expect(p.text()).toContain('limited');
            expect(p.find('a').length).toBe(1);

            scope.limited = false;
            scope.$digest();
            expect(p.text()).toContain('full');
            expect(p.find('a').length).toBe(0);
        });
        it('depending on whether the description is longer than the limit', function() {
            this.controller.descriptionLimit = 10;
            spyOn(this.controller, 'getDescription').and.returnValue('AAAAA');
            scope.$digest();
            expect(this.element.find('a').length).toBe(0);

            this.controller.getDescription.and.returnValue('AAAAAAAAAAAAAAA');
            scope.$digest();
            expect(this.element.find('a').length).toBe(1);
        });
        it('depending on whether the full description should be shown', function() {
            this.controller.descriptionLimit = 10;
            spyOn(this.controller, 'getDescription').and.returnValue('AAAAAAAAAAAAAAA');
            this.controller.full = false;
            scope.$digest();
            var a = this.element.find('a');
            expect(a.text()).toBe('Show more');

            this.controller.full = true;
            scope.$digest();
            expect(a.text()).toBe('Show less');
        });
    });
    it('should toggle full when the Show link is clicked', function() {
        this.controller.descriptionLimit = 10;
        spyOn(this.controller, 'getDescription').and.returnValue('AAAAAAAAAAAAAAA');
        scope.$digest();

        var link = this.element.find('a');
        link.triggerHandler('click');
        expect(this.controller.full).toBe(true);
    });
});