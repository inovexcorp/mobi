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
describe('Instance Creator directive', function() {
    var $compile, scope, discoverStateSvc, exploreSvc, $q, util, exploreUtilsSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('instanceCreator');
        mockDiscoverState();
        mockUtil();
        mockExplore();
        mockExploreUtils();
        mockPrefixes();

        inject(function(_$q_, _$compile_, _$rootScope_, _discoverStateService_, _exploreService_, _utilService_, _exploreUtilsService_, _prefixes_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            util = _utilService_;
            exploreUtilsSvc = _exploreUtilsService_;
            prefixes = _prefixes_;
        });

        this.element = $compile(angular.element('<instance-creator></instance-creator>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('instanceCreator');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        exploreSvc = null;
        $q = null;
        util = null;
        exploreUtilsSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('instance-creator')).toBe(true);
            expect(this.element.hasClass('instance-editor')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a breadcrumbs', function() {
            expect(this.element.find('breadcrumbs').length).toBe(1);
        });
        it('with block-header .links', function() {
            expect(this.element.querySelectorAll('block-header .link').length).toBe(2);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a instance-form', function() {
            expect(this.element.find('instance-form').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('save should call the correct functions when createInstance is', function() {
            beforeEach(function() {
                this.instance = {'@id': 'id'};
                this.instance[prefixes.dcterms + 'title'] = [{'@value': 'title'}, {'@value': 'arabic', '@language': 'ar'}];
                this.instance[prefixes.rdfs + 'label'] = [{'@value': 'label'}];
                this.instance[prefixes.rdfs + 'comment'] = [{'@value': 'comment', '@language': 'en'}, {'@value': 'arabic', '@language': 'ar'}];
                this.cleanEntity = [{prop: 'new'}];
                discoverStateSvc.explore.instance.entity = [this.instance];
                discoverStateSvc.getInstance.and.returnValue(this.instance);
                exploreUtilsSvc.removeEmptyPropertiesFromArray.and.returnValue(this.cleanEntity);
                discoverStateSvc.explore.instanceDetails.currentPage = 1;
                discoverStateSvc.explore.instanceDetails.limit = 1;
                discoverStateSvc.explore.instanceDetails.total = 3;
            });
            describe('resolved and getClassInstanceDetails is', function() {
                beforeEach(function() {
                    exploreSvc.createInstance.and.returnValue($q.when());
                });
                describe('resolved and getClassDetails is', function() {
                    beforeEach(function () {
                        this.resultsObject = {data: [{ instanceIRI: 'id2' }], links: {next: 'next', prev: 'prev'}};
                        discoverStateSvc.explore.breadcrumbs = ['old title'];
                        exploreSvc.getClassInstanceDetails.and.returnValue($q.when({}));
                        exploreSvc.createPagedResultsObject.and.returnValue(this.resultsObject);
                    });
                    it('resolved', function() {
                        exploreSvc.getClassDetails.and.returnValue($q.when([{}]));
                        this.controller.save();
                        scope.$apply();
                        expect(discoverStateSvc.getInstance).toHaveBeenCalled();
                        expect(exploreUtilsSvc.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                        expect(discoverStateSvc.explore.instance.entity).toEqual(this.cleanEntity);
                        expect(exploreSvc.createInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.instance.entity);
                        expect(discoverStateSvc.explore.instanceDetails.total).toBe(4);
                        expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {offset: 0, limit: 1});
                        expect(discoverStateSvc.explore.instanceDetails.data).toEqual(this.resultsObject.data);
                        expect(discoverStateSvc.explore.instanceDetails.links).toEqual(this.resultsObject.links);
                        expect(discoverStateSvc.explore.instance.metadata).toEqual({instanceIRI: this.instance['@id'], title: 'title', description: 'comment'});
                        expect(_.last(discoverStateSvc.explore.breadcrumbs)).toBe('title');
                        expect(discoverStateSvc.explore.creating).toEqual(false);
                        expect(exploreSvc.getClassDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId);
                        expect(discoverStateSvc.explore.classDetails).toEqual([{}]);
                    });
                    it('rejected', function() {
                        exploreSvc.getClassDetails.and.returnValue($q.reject('error'));
                        this.controller.save();
                        scope.$apply();
                        expect(discoverStateSvc.getInstance).toHaveBeenCalled();
                        expect(exploreUtilsSvc.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                        expect(discoverStateSvc.explore.instance.entity).toEqual(this.cleanEntity);
                        expect(exploreSvc.createInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.instance.entity);
                        expect(discoverStateSvc.explore.instanceDetails.total).toBe(4);
                        expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {offset: 0, limit: 1});
                        expect(discoverStateSvc.explore.instanceDetails.data).toEqual(this.resultsObject.data);
                        expect(discoverStateSvc.explore.instanceDetails.links).toEqual(this.resultsObject.links);
                        expect(discoverStateSvc.explore.instance.metadata).toEqual({instanceIRI: this.instance['@id'], title: 'title', description: 'comment'});
                        expect(_.last(discoverStateSvc.explore.breadcrumbs)).toBe('title');
                        expect(discoverStateSvc.explore.creating).toEqual(false);
                        expect(exploreSvc.getClassDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId);
                        expect(discoverStateSvc.explore.classDetails).toEqual([]);
                        expect(util.createErrorToast).toHaveBeenCalledWith('error');
                    });
                });
                it('rejected', function() {
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('error'));
                    this.controller.save();
                    scope.$apply();
                    expect(discoverStateSvc.getInstance).toHaveBeenCalled();
                    expect(exploreUtilsSvc.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                    expect(discoverStateSvc.explore.instance.entity).toEqual(this.cleanEntity);
                    expect(exploreSvc.createInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.instance.entity);
                    expect(discoverStateSvc.explore.instanceDetails.total).toBe(4);
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {offset: 0, limit: 1});
                    expect(exploreSvc.getClassDetails).not.toHaveBeenCalled();
                    expect(util.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('rejected', function() {
                exploreSvc.createInstance.and.returnValue($q.reject('error'));
                this.controller.save();
                scope.$apply();
                expect(discoverStateSvc.getInstance).toHaveBeenCalled();
                expect(exploreUtilsSvc.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                expect(discoverStateSvc.explore.instance.entity).toEqual(this.cleanEntity);
                expect(exploreSvc.createInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.instance.entity);
                expect(discoverStateSvc.explore.instanceDetails.total).toBe(3);
                expect(exploreSvc.getClassInstanceDetails).not.toHaveBeenCalled();
                expect(exploreSvc.getClassDetails).not.toHaveBeenCalled();
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        it('cancel sets the correct variables', function() {
            discoverStateSvc.explore.instance.entity = {'@id': 'entity'};
            discoverStateSvc.explore.breadcrumbs = ['classId', 'new'];
            this.controller.cancel();
            expect(discoverStateSvc.explore.instance.entity).toEqual({});
            expect(discoverStateSvc.explore.creating).toBe(false);
            expect(discoverStateSvc.explore.breadcrumbs).toEqual(['classId']);
        });
    });
});