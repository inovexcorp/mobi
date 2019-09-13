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
 * 
 */
import {
    mockOntologyState,
    mockOntologyUtilsManager,
    injectSplitIRIFilter
} from '../../../../../../test/js/Shared';

describe('Usages Block component', function() {
    var $compile, scope, ontologyStateSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockOntologyState();
        mockOntologyUtilsManager();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        ontologyStateSvc.getActiveKey.and.returnValue('test');
        scope.usages = [];
        this.element = $compile(angular.element('<usages-block usages="usages"></usages-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('usagesBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('USAGES-BLOCK');
            expect(this.element.querySelectorAll('.usages-block').length).toEqual(1);
        });
        ['.section-header', '.text-center', '.usages-container'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.querySelectorAll(test).length).toEqual(1);
            });
        });
        it('depending on how many results there are', function() {
            expect(this.element.querySelectorAll('.property-values').length).toEqual(0);

            this.controller.results = { 'iri': {} };
            scope.$digest();
            expect(this.element.querySelectorAll('.property-values').length).toEqual(_.keys(this.controller.results).length);
        });
        it('depending on how many values a result has', function() {
            this.controller.results = {
                'iri': {}
            };
            scope.$digest();
            var result = angular.element(this.element.querySelectorAll('.property-values')[0]);
            expect(result.querySelectorAll('.value-container').length).toEqual(0);

            this.controller.results.iri = {'test': {}};
            scope.$digest();
            expect(result.querySelectorAll('.prop-value-container').length).toEqual(_.keys(this.controller.results.iri).length);
        });
    });
    it('should update the results when the usages change', function() {
        scope.usages = [{
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
        }];
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
        expect(this.controller.total).toEqual(scope.usages.length);
        expect(this.controller.shown).toEqual(_.min([scope.usages.length, this.controller.size]));
    });
    describe('controller methods', function() {
        it('getMoreResults populates variables correctly', function() {
            this.controller.usages = [{
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
            }];
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
            expect(this.controller.index).toEqual(0);
            expect(this.controller.results).toEqual(expected);
            expect(this.controller.shown).toEqual(this.controller.size);
        });
    });
});