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
    var $compile, scope, discoverStateSvc, exploreSvc, $q, util, exploreUtilsSvc;

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

        this.element = $compile(angular.element('<instance-editor></instance-editor>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('instanceEditor');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        exploreSvc = null;
        $q = null;
        util = null;
        exploreUtilsSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('instance-editor')).toBe(true);
        });
        it('for a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('for a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('for a breadcrumbs', function() {
            expect(this.element.find('breadcrumbs').length).toBe(1);
        });
        it('for block-header .links', function() {
            expect(this.element.querySelectorAll('block-header .link').length).toBe(2);
        });
        it('for a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('for a instance-form', function() {
            expect(this.element.find('instance-form').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('save should call the correct functions when updateInstance is', function() {
            beforeEach(function() {
                this.instance = {'@id': 'id'};
                discoverStateSvc.explore.instance.entity = [this.instance];
                discoverStateSvc.getInstance.and.returnValue(this.instance);
                exploreUtilsSvc.removeEmptyPropertiesFromArray.and.returnValue([{prop: 'new'}]);
            });
            describe('resolved and getClassInstanceDetails is', function() {
                beforeEach(function() {
                    this.instanceIRI = discoverStateSvc.explore.instance.metadata.instanceIRI;
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
                    this.controller.save();
                    scope.$apply();
                    expect(discoverStateSvc.getInstance).toHaveBeenCalled();
                    expect(exploreUtilsSvc.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                    expect(discoverStateSvc.explore.instance.entity).toEqual([{prop: 'new'}]);
                    expect(exploreSvc.updateInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, this.instanceIRI, discoverStateSvc.explore.instance.entity);
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {offset: discoverStateSvc.explore.instanceDetails.currentPage * discoverStateSvc.explore.instanceDetails.limit, limit: discoverStateSvc.explore.instanceDetails.limit});
                    expect(discoverStateSvc.explore.instanceDetails.data).toEqual(data);
                    expect(discoverStateSvc.explore.instance.metadata).toEqual({instanceIRI: 'id', title: 'title'});
                    expect(_.last(discoverStateSvc.explore.breadcrumbs)).toBe('title');
                    expect(discoverStateSvc.explore.editing).toEqual(false);
                });
                it('rejected', function() {
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('error'));
                    this.controller.save();
                    scope.$apply();
                    expect(discoverStateSvc.getInstance).toHaveBeenCalled();
                    expect(exploreUtilsSvc.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                    expect(discoverStateSvc.explore.instance.entity).toEqual([{prop: 'new'}]);
                    expect(exploreSvc.updateInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, this.instanceIRI, discoverStateSvc.explore.instance.entity);
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {offset: discoverStateSvc.explore.instanceDetails.currentPage * discoverStateSvc.explore.instanceDetails.limit, limit: discoverStateSvc.explore.instanceDetails.limit});
                    expect(util.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('rejected', function() {
                exploreSvc.updateInstance.and.returnValue($q.reject('error'));
                this.controller.save();
                scope.$apply();
                expect(discoverStateSvc.getInstance).toHaveBeenCalled();
                expect(exploreUtilsSvc.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                expect(discoverStateSvc.explore.instance.entity).toEqual([{prop: 'new'}]);
                expect(exploreSvc.updateInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.instance.metadata.instanceIRI, discoverStateSvc.explore.instance.entity);
                expect(exploreSvc.getClassInstanceDetails).not.toHaveBeenCalled();
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        it('cancel sets the correct variables', function() {
            this.controller.original = {'@id': 'original'};
            discoverStateSvc.explore.instance.entity = {'@id': 'entity'};
            this.controller.cancel();
            expect(discoverStateSvc.explore.instance.entity).toEqual(this.controller.original);
            expect(discoverStateSvc.explore.editing).toBe(false);
        });
    });
});