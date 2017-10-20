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
describe('Instance Editor directive', function() {
    var $compile, scope, element, discoverStateSvc, controller, exploreSvc, $q, util, exploreUtilsSvc;

    beforeEach(function() {
        module('templates');
        module('instanceEditor');
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
        
        element = $compile(angular.element('<instance-editor></instance-editor>'))(scope);
        scope.$digest();
        controller = element.controller('instanceEditor');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('instance-editor')).toBe(true);
        });
        it('for a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('for a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('for a breadcrumbs', function() {
            expect(element.find('breadcrumbs').length).toBe(1);
        });
        it('for block-header .links', function() {
            expect(element.querySelectorAll('block-header .link').length).toBe(2);
        });
        it('for a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('for a instance-form', function() {
            expect(element.find('instance-form').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('save should call the correct functions when updateInstance is', function() {
            var instance = {'@id': 'id'};
            beforeEach(function() {
                discoverStateSvc.explore.instance.entity = [instance];
                discoverStateSvc.getInstance.and.returnValue(instance);
                exploreUtilsSvc.removeEmptyPropertiesFromArray.and.returnValue([{prop: 'new'}]);
            });
            describe('resolved and getClassInstanceDetails is', function() {
                var instanceIRI;
                beforeEach(function() {
                    instanceIRI = discoverStateSvc.explore.instance.metadata.instanceIRI;
                    exploreSvc.updateInstance.and.returnValue($q.when());
                });
                it('resolved', function() {
                    var data = [{
                        instanceIRI: 'id',
                        title: 'title'
                    }, {
                        instanceIRI: 'id2'
                    }];
                    discoverStateSvc.explore.breadcrumbs = ['old title'];
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.when({data: data}));
                    controller.save();
                    scope.$apply();
                    expect(discoverStateSvc.getInstance).toHaveBeenCalled();
                    expect(exploreUtilsSvc.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([instance]);
                    expect(discoverStateSvc.explore.instance.entity).toEqual([{prop: 'new'}]);
                    expect(exploreSvc.updateInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, instanceIRI, discoverStateSvc.explore.instance.entity);
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {offset: discoverStateSvc.explore.instanceDetails.currentPage * discoverStateSvc.explore.instanceDetails.limit, limit: discoverStateSvc.explore.instanceDetails.limit});
                    expect(discoverStateSvc.explore.instanceDetails.data).toEqual(data);
                    expect(discoverStateSvc.explore.instance.metadata).toEqual({instanceIRI: 'id', title: 'title'});
                    expect(_.last(discoverStateSvc.explore.breadcrumbs)).toBe('title');
                    expect(discoverStateSvc.explore.editing).toEqual(false);
                });
                it('rejected', function() {
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('error'));
                    controller.save();
                    scope.$apply();
                    expect(discoverStateSvc.getInstance).toHaveBeenCalled();
                    expect(exploreUtilsSvc.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([instance]);
                    expect(discoverStateSvc.explore.instance.entity).toEqual([{prop: 'new'}]);
                    expect(exploreSvc.updateInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, instanceIRI, discoverStateSvc.explore.instance.entity);
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {offset: discoverStateSvc.explore.instanceDetails.currentPage * discoverStateSvc.explore.instanceDetails.limit, limit: discoverStateSvc.explore.instanceDetails.limit});
                    expect(util.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('rejected', function() {
                exploreSvc.updateInstance.and.returnValue($q.reject('error'));
                controller.save();
                scope.$apply();
                expect(discoverStateSvc.getInstance).toHaveBeenCalled();
                expect(exploreUtilsSvc.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([instance]);
                expect(discoverStateSvc.explore.instance.entity).toEqual([{prop: 'new'}]);
                expect(exploreSvc.updateInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.instance.metadata.instanceIRI, discoverStateSvc.explore.instance.entity);
                expect(exploreSvc.getClassInstanceDetails).not.toHaveBeenCalled();
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        it('cancel sets the correct variables', function() {
            controller.original = {'@id': 'original'};
            discoverStateSvc.explore.instance.entity = {'@id': 'entity'};
            controller.cancel();
            expect(discoverStateSvc.explore.instance.entity).toEqual(controller.original);
            expect(discoverStateSvc.explore.editing).toBe(false);
        });
    });
});