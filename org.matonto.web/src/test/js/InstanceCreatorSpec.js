/*-
 * #%L
 * org.matonto.web
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
describe('Instance Creator directive', function() {
    var $compile, scope, element, discoverStateSvc, controller, exploreSvc, $q, util, exploreUtilsSvc;

    beforeEach(function() {
        module('templates');
        module('instanceCreator');
        mockDiscoverState();
        mockUtil();
        mockExplore();
        mockExploreUtils();

        inject(function(_$q_, _$compile_, _$rootScope_, _discoverStateService_, _exploreService_, _utilService_, _exploreUtilsService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            util = _utilService_;
            exploreUtilsSvc = _exploreUtilsService_;
        });
        
        element = $compile(angular.element('<instance-creator></instance-creator>'))(scope);
        scope.$digest();
        controller = element.controller('instanceCreator');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('instance-creator')).toBe(true);
            expect(element.hasClass('instance-editor')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a breadcrumbs', function() {
            expect(element.find('breadcrumbs').length).toBe(1);
        });
        it('with block-header .links', function() {
            expect(element.querySelectorAll('block-header .link').length).toBe(2);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with a instance-form', function() {
            expect(element.find('instance-form').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('save should call the correct functions when createInstance is', function() {
            var instance = {'@id': 'id'};
            beforeEach(function() {
                discoverStateSvc.explore.instance.entity = [instance];
                discoverStateSvc.getInstance.and.returnValue(instance);
                exploreUtilsSvc.removeEmptyProperties.and.returnValue(instance);
                exploreUtilsSvc.removeEmptyPropertiesFromArray.and.returnValue([{prop: 'new'}]);
            });
            describe('resolved and getClassInstanceDetails is', function() {
                beforeEach(function() {
                    exploreSvc.createInstance.and.returnValue($q.when());
                });
                it('resolved', function() {
                    var data = [{
                        instanceIRI: 'id',
                        title: 'title'
                    }, {
                        instanceIRI: 'id2'
                    }, {
                        instanceIRI: 'id3'
                    }, {
                        instanceIRI: 'id4'
                    }];
                    discoverStateSvc.explore.breadcrumbs = ['old title'];
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.when({data: data}));
                    discoverStateSvc.explore.instanceDetails.limit = 1;
                    controller.save();
                    scope.$apply();
                    expect(discoverStateSvc.getInstance).toHaveBeenCalled();
                    expect(exploreUtilsSvc.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([instance]);
                    expect(discoverStateSvc.explore.instance.entity).toEqual([{prop: 'new'}]);
                    expect(exploreSvc.createInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.instance.entity);
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {});
                    expect(discoverStateSvc.explore.instanceDetails.data).toEqual([data[0]]);
                    expect(discoverStateSvc.explore.instance.metadata).toEqual({instanceIRI: 'id', title: 'title'});
                    expect(_.last(discoverStateSvc.explore.breadcrumbs)).toBe('title');
                    expect(discoverStateSvc.explore.creating).toEqual(false);
                });
                it('rejected', function() {
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('error'));
                    controller.save();
                    scope.$apply();
                    expect(discoverStateSvc.getInstance).toHaveBeenCalled();
                    expect(exploreUtilsSvc.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([instance]);
                    expect(discoverStateSvc.explore.instance.entity).toEqual([{prop: 'new'}]);
                    expect(exploreSvc.createInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.instance.entity);
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {});
                    expect(util.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('rejected', function() {
                exploreSvc.createInstance.and.returnValue($q.reject('error'));
                controller.save();
                scope.$apply();
                expect(discoverStateSvc.getInstance).toHaveBeenCalled();
                expect(exploreUtilsSvc.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([instance]);
                expect(discoverStateSvc.explore.instance.entity).toEqual([{prop: 'new'}]);
                expect(exploreSvc.createInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.instance.entity);
                expect(exploreSvc.getClassInstanceDetails).not.toHaveBeenCalled();
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        it('cancel sets the correct variables', function() {
            discoverStateSvc.explore.instance.entity = {'@id': 'entity'};
            discoverStateSvc.explore.breadcrumbs = ['classId', 'new'];
            controller.cancel();
            expect(discoverStateSvc.explore.instance.entity).toEqual({});
            expect(discoverStateSvc.explore.creating).toBe(false);
            expect(discoverStateSvc.explore.breadcrumbs).toEqual(['classId']);
        });
    });
});