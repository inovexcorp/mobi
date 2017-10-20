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
describe('Instance Cards directive', function() {
    var $compile, scope, element, discoverStateSvc, controller, exploreSvc, utilSvc, $q;

    beforeEach(function() {
        module('templates');
        module('instanceCards');
        mockDiscoverState();
        mockExplore();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_, _exploreService_, _utilService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            utilSvc = _utilService_;
            $q = _$q_;
        });

        discoverStateSvc.explore.recordId = 'recordId';
        discoverStateSvc.explore.instanceDetails.data = [{
            title: 'y'
        }, {
            title: 'z'
        }, {
            title: 'b'
        }, {
            title: 'a'
        }];
        element = $compile(angular.element('<instance-cards></instance-cards>'))(scope);
        scope.$digest();
        controller = element.controller('instanceCards');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('instance-cards')).toBe(true);
            expect(element.hasClass('class-cards')).toBe(true);
            expect(element.hasClass('full-height')).toBe(true);
        });
        it('with a .rows-container.full-height', function() {
            expect(element.querySelectorAll('.rows-container.full-height').length).toBe(1);
        });
        it('with a .row', function() {
            expect(element.querySelectorAll('.row').length).toBe(2);
        });
        it('with a .col-xs-4.card-container', function() {
            expect(element.querySelectorAll('.col-xs-4.card-container').length).toBe(4);
        });
        it('with a md-card', function() {
            expect(element.find('md-card').length).toBe(4);
        });
        it('with a md-card-title', function() {
            expect(element.find('md-card-title').length).toBe(4);
        });
        it('with a md-card-title-text', function() {
            expect(element.find('md-card-title-text').length).toBe(4);
        });
        it('with a .card-header', function() {
            expect(element.querySelectorAll('.card-header').length).toBe(4);
        });
        it('with a .md-headline.text', function() {
            expect(element.querySelectorAll('.md-headline.text').length).toBe(4);
        });
        it('with a md-card-content', function() {
            expect(element.find('md-card-content').length).toBe(4);
        });
        it('with a .overview', function() {
            expect(element.querySelectorAll('.overview').length).toBe(4);
        });
        it('with a md-card-actions', function() {
            expect(element.find('md-card-actions').length).toBe(4);
        });
        it('with a md-button', function() {
            expect(element.find('md-button').length).toBe(4);
        });
    });
    it('properly defines controller.chunks on load', function() {
        var expected = [[{
            title: 'a'
        }, {
            title: 'b'
        }, {
            title: 'y'
        }], [{
            title: 'z'
        }]];
        expect(angular.copy(element.controller('instanceCards').chunks)).toEqual(expected);
    });
    describe('controller methods', function() {
        describe('view should set the correct variables when getInstance is', function() {
            it('resolved', function() {
                var data = {'@id': 'instanceId'};
                var item = {instanceIRI: 'instanceId', title: 'title'};
                discoverStateSvc.explore.breadcrumbs = ['', ''];
                exploreSvc.getInstance.and.returnValue($q.when(data));
                controller.view(item);
                scope.$apply();
                expect(exploreSvc.getInstance).toHaveBeenCalledWith('recordId', 'instanceId');
                expect(discoverStateSvc.explore.instance.entity).toEqual(data);
                expect(discoverStateSvc.explore.instance.metadata).toEqual(item);
                expect(discoverStateSvc.explore.breadcrumbs).toEqual(['', '', 'title']);
            });
            it('rejected', function() {
                exploreSvc.getInstance.and.returnValue($q.reject('error'));
                controller.view({instanceIRI: 'instanceId', title: 'title'});
                scope.$apply();
                expect(exploreSvc.getInstance).toHaveBeenCalledWith('recordId', 'instanceId');
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
    });
});