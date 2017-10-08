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
describe('Usages Block directive', function() {
    var $compile, scope, element, controller, ontologyStateSvc, ontologyManagerSvc, ontologyUtilsManagerSvc, splitIRIFilter;

    beforeEach(function() {
        module('templates');
        module('usagesBlock');
        injectSplitIRIFilter();
        injectBeautifyFilter();
        mockOntologyState();
        mockOntologyManager();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _ontologyUtilsManagerService_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
            splitIRIFilter = _splitIRIFilter_;
        });

        ontologyStateSvc.state = {
            test: {
                usages: []
            }
        };
        ontologyStateSvc.getActiveKey.and.returnValue('test');
        element = $compile(angular.element('<usages-block></usages-block>'))(scope);
        scope.$digest();
        controller = element.controller('usagesBlock');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('usages-block')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with a .text-center', function() {
            expect(element.querySelectorAll('.text-center').length).toBe(1);
        });
        it('depending on how many results there are', function() {
            expect(element.querySelectorAll('block-content .property-values').length).toBe(0);

            controller.results = {
                'iri': {}
            };
            scope.$digest();
            expect(element.querySelectorAll('block-content .property-values').length).toBe(1);
            expect(element.querySelectorAll('.property-values').length).toBe(_.keys(controller.results).length);
        });
        it('depending on how many values a result has', function() {
            controller.results = {
                'iri': {}
            };
            scope.$digest();
            var result = angular.element(element.querySelectorAll('.property-values')[0]);
            expect(result.querySelectorAll('.value-container').length).toBe(0);

            controller.results.iri = {'test': {}};
            scope.$digest();
            expect(result.querySelectorAll('.value-container').length).toBe(_.keys(controller.results.iri).length);
        });
    });
    it('should update the results when the usages change', function() {
        ontologyStateSvc.getActivePage.and.returnValue({
            usages: [{
                s: {value: 'A'},
                p: {value: 'B'},
                o: {value: 'test'}
            }, {
                s: {value: 'B'},
                p: {value: 'test'},
                o: {value: 'A'}
            }, {
                s: {value: 'B'},
                p: {value: 'A'},
                o: {value: 'test'}
            }, {
                s: {value: 'B'},
                p: {value: 'B'},
                o: {value: 'test'}
            }, {
                s: {value: 'B'},
                p: {value: 'test'},
                o: {value: 'B'}
            }]
        });
        var expected = {
            B: [{
                subject: 'A', predicate: 'B', object: 'test'
            }, {
                subject: 'B', predicate: 'B', object: 'test'
            }],
            test: [{
                subject: 'B', predicate: 'test', object: 'A'
            }, {
                subject: 'B', predicate: 'test', object: 'B'
            }],
            A: [{
                subject: 'B', predicate: 'A', object: 'test'
            }]
        };
        ontologyStateSvc.listItem.selected = {'@id': 'test'};
        scope.$digest();
        expect(angular.copy(controller.results)).toEqual(expected);
        expect(controller.total).toBe(ontologyStateSvc.getActivePage().usages.length);
        expect(controller.shown).toBe(_.min([ontologyStateSvc.getActivePage().usages.length, controller.size]));
    });
    describe('controller methods', function() {
        it('getMoreResults populates variables correctly', function() {
            ontologyStateSvc.getActivePage.and.returnValue({
                usages: [{
                    s: {value: 'A'},
                    p: {value: 'B'},
                    o: {value: 'test'}
                }, {
                    s: {value: 'B'},
                    p: {value: 'test'},
                    o: {value: 'A'}
                }, {
                    s: {value: 'B'},
                    p: {value: 'A'},
                    o: {value: 'test'}
                }, {
                    s: {value: 'B'},
                    p: {value: 'B'},
                    o: {value: 'test'}
                }, {
                    s: {value: 'B'},
                    p: {value: 'test'},
                    o: {value: 'B'}
                }]
            });
            var expected = {
                B: [{
                    subject: 'A', predicate: 'B', object: 'test'
                }],
                test: [{
                    subject: 'B', predicate: 'test', object: 'A'
                }]
            };
            controller.index = -1;
            controller.size = 2;
            controller.getMoreResults();
            expect(controller.index).toBe(0);
            expect(controller.results).toEqual(expected);
            expect(controller.shown).toBe(controller.size);
        });
    });
});