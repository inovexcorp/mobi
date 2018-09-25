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
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc, ontologyUtilsManagerSvc, splitIRI;

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
            splitIRI = _splitIRIFilter_;
        });

        ontologyStateSvc.state = {
            test: {
                usages: []
            }
        };
        ontologyStateSvc.getActiveKey.and.returnValue('test');
        this.element = $compile(angular.element('<usages-block></usages-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('usagesBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        ontologyUtilsManagerSvc = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('usages-block')).toBe(true);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toBe(1);
        });
        it('with a .text-center', function() {
            expect(this.element.querySelectorAll('.text-center').length).toBe(1);
        });
        it('depending on how many results there are', function() {
            expect(this.element.querySelectorAll('.property-values').length).toBe(0);

            this.controller.results = {
                'iri': {}
            };
            scope.$digest();
            expect(this.element.querySelectorAll('.property-values').length).toBe(_.keys(this.controller.results).length);
        });
        it('depending on how many values a result has', function() {
            this.controller.results = {
                'iri': {}
            };
            scope.$digest();
            var result = angular.element(this.element.querySelectorAll('.property-values')[0]);
            expect(result.querySelectorAll('.value-container').length).toBe(0);

            this.controller.results.iri = {'test': {}};
            scope.$digest();
            expect(result.querySelectorAll('.value-container').length).toBe(_.keys(this.controller.results.iri).length);
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
        expect(angular.copy(this.controller.results)).toEqual(expected);
        expect(this.controller.total).toBe(ontologyStateSvc.getActivePage().usages.length);
        expect(this.controller.shown).toBe(_.min([ontologyStateSvc.getActivePage().usages.length, this.controller.size]));
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
            this.controller.index = -1;
            this.controller.size = 2;
            this.controller.getMoreResults();
            expect(this.controller.index).toBe(0);
            expect(this.controller.results).toEqual(expected);
            expect(this.controller.shown).toBe(this.controller.size);
        });
    });
});