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
describe('Instance View directive', function() {
    var $compile, scope, element, controller, discoverStateSvc, exploreUtilsSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('instanceView');
        mockDiscoverState();
        mockUtil();
        mockExploreUtils();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_, _exploreUtilsService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            exploreUtilsSvc = _exploreUtilsService_;
            prefixes = _prefixes_;
        });

        discoverStateSvc.getInstance.and.returnValue({
            '@id': 'ignored',
            '@type': ['ignored'],
            prop1: [{
                '@id': 'http://matonto.org/id'
            }],
            prop2: [{
                '@value': 'value1'
            }, {
                '@value': 'value2'
            }]
        });
        discoverStateSvc.explore.instance.metadata.instanceIRI = 'instanceIRI';
        exploreUtilsSvc.getReification.and.callFake(function(arr, sub, pred, value) {
            if (_.isEqual(value, {'@value': 'value1'})) {
                return {prop3: [{'@value': 'value3'}]};
            }
            return undefined;
        });
        element = $compile(angular.element('<instance-view></instance-view>'))(scope);
        scope.$digest();
        controller = element.controller('instanceView');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('instance-view')).toBe(true);
        });
        it('for a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a breadcrumbs', function() {
            expect(element.find('breadcrumbs').length).toBe(1);
        });
        it('with a .pull-right.edit-button', function() {
            expect(element.querySelectorAll('.pull-right.edit-button').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with a .row', function() {
            expect(element.querySelectorAll('.row').length).toBe(1);
        });
        it('with a .col-xs-8.col-xs-offset-2', function() {
            expect(element.querySelectorAll('.col-xs-8.col-xs-offset-2').length).toBe(1);
        });
        it('with a h2', function() {
            expect(element.find('h2').length).toBe(1);
        });
        it('with a small', function() {
            expect(element.find('small').length).toBe(1);
        });
        it('with three h3.property', function() {
            expect(element.querySelectorAll('h3.property').length).toBe(3);
        });
        it('with three ul.values', function() {
            expect(element.querySelectorAll('ul.values').length).toBe(3);
        });
        it('with a .values.show-link', function() {
            expect(element.querySelectorAll('.values.show-link').length).toBe(1);

            discoverStateSvc.getInstance.and.returnValue({
                '@id': 'ignored',
                '@type': ['ignored'],
                'prop1': [{
                    '@id': 'http://matonto.org/id'
                }]
            });
            element = $compile(angular.element('<instance-view></instance-view>'))(scope);
            scope.$digest();

            expect(element.querySelectorAll('.values.show-link').length).toBe(0);
        });
        it('with a .values.show-more', function() {
            expect(element.querySelectorAll('.values.show-more').length).toBe(0);
            angular.element(element.querySelectorAll('.link')[0]).triggerHandler('click');
            expect(element.querySelectorAll('.values.show-more').length).toBe(1);
        });
        it('with three li.link-containers', function() {
            expect(element.querySelectorAll('li.link-container').length).toBe(3);
        });
        it('with three a.links', function() {
            expect(element.querySelectorAll('a.link').length).toBe(3);
        });
        it('with a a.more', function() {
            expect(element.querySelectorAll('a.more').length).toBe(0);
            angular.element(element.querySelectorAll('.link')[0]).triggerHandler('click');
            expect(element.querySelectorAll('a.more').length).toBe(1);
        });
        it('depending on whether reification statements are shown', function() {
            var showReification = angular.element(element.querySelectorAll('.show-reification')[0]);
            var icon = angular.element(showReification.children()[0]);
            expect(icon.hasClass('fa-angle-down')).toBe(true);
            expect(icon.hasClass('fa-angle-up')).toBe(false);

            showReification.triggerHandler('click');
            expect(icon.hasClass('fa-angle-down')).toBe(false);
            expect(icon.hasClass('fa-angle-up')).toBe(true);
        });
    });
    describe('controller methods', function() {
        describe('getLimit returns the proper value when limit and array.length are', function() {
            it('equal', function() {
                expect(controller.getLimit(['', ''], 2)).toBe(1);
            });
            it('not equal', function() {
                expect(controller.getLimit(['', ''], 1)).toBe(2);
            });
        });
        it('getReification should retrieve the Statement object for a property value', function() {
            var statement = {
                '@id': 'test',
                '@type': ['Statement'],
                prop3: [{'@value': 'value'}],
            };
            statement[prefixes.rdf + 'subject'] = [{'@id': 'subject'}];
            statement[prefixes.rdf + 'predicate'] = [{'@id': 'predicate'}];
            statement[prefixes.rdf + 'object'] = [{'@value': 'value'}];
            exploreUtilsSvc.getReification.and.returnValue(statement);
            expect(controller.getReification('', {})).toEqual({prop3: [{'@value': 'value'}]});
            expect(exploreUtilsSvc.getReification).toHaveBeenCalledWith(discoverStateSvc.explore.instance.entity, discoverStateSvc.explore.instance.metadata.instanceIRI, '', {});

            exploreUtilsSvc.getReification.and.returnValue(undefined);
            expect(controller.getReification('', {})).toBeUndefined();
            expect(exploreUtilsSvc.getReification).toHaveBeenCalledWith(discoverStateSvc.explore.instance.entity, discoverStateSvc.explore.instance.metadata.instanceIRI, '', {});
        });
    });
    it('should set the variable correctly when edit button is clicked', function() {
        discoverStateSvc.explore.editing = false;
        var button = angular.element(element.querySelectorAll('.pull-right.edit-button')[0]);
        button.triggerHandler('click');
        expect(discoverStateSvc.explore.editing).toBe(true);
    });
});