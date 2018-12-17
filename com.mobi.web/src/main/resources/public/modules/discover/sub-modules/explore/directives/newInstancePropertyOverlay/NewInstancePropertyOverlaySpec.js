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
describe('New Instance Property Overlay component', function() {
    var $compile, scope, discoverStateSvc, exploreUtils, util;

    beforeEach(function() {
        module('templates');
        module('newInstancePropertyOverlay');
        mockDiscoverState();
        mockExploreUtils();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_, _exploreUtilsService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            exploreUtils = _exploreUtilsService_;
            util = _utilService_;
        });

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        scope.resolve = {properties: [{}], instance: {}};
        this.element = $compile(angular.element('<new-instance-property-overlay close="close($value)" dismiss="dismiss()" resolve="resolve"></new-instance-property-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('newInstancePropertyOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        exploreUtils = null;
        util = null;
        this.element.remove();
    });

    describe('controller bound variables', function() {
        it('close should be called in the parent scope', function() {
            this.controller.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in the parent scope', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
        it('resolve is one way bound', function() {
            this.controller.resolve = {};
            scope.$digest();
            expect(scope.resolve).toEqual({properties: [{}], instance: {}});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('NEW-INSTANCE-PROPERTY-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        ['form', 'h3', 'p', 'md-autocomplete'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
        it('with buttons to cancel and submit', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    describe('controller methods', function() {
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
        it('should get the list of properties', function() {
            exploreUtils.getNewProperties.and.returnValue([{}]);
            expect(this.controller.getProperties()).toEqual([{}]);
            expect(exploreUtils.getNewProperties).toHaveBeenCalledWith(this.controller.resolve.properties, this.controller.resolve.instance, this.controller.propertyIRI);
        });
        it('should submit the modal adding the property to the instance', function() {
            this.controller.submit();
            expect(this.controller.resolve.instance[this.controller.propertyIRI]).toEqual([]);
            expect(scope.close).toHaveBeenCalledWith(this.controller.propertyIRI);
        });
    });
});