/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import {
    mockOntologyManager,
    mockMapperState,
    mockUtil,
    mockPrefixes,
    injectHighlightFilter,
    injectTrustedFilter,
    injectSplitIRIFilter
} from '../../../../../../test/js/Shared';

describe('Class Select component', function() {
    let $compile, scope, $q, ontologyManagerSvc, mapperStateSvc, utilSvc, prefixes, splitIRI;

    const returnedClasses = [
            {id: {value: 'class1'}, label: {value: 'class1'}, description: {value: 'description1'}, deprecated: {value: false}},
            {id: {value: 'class2'}, label: {value: 'class2'}, description: {value: 'description2'}, deprecated: {value: false}},
            {id: {value: 'class3'}, label: {value: 'class3'}, description: {value: 'description3'}, deprecated: {value: true}}
        ]

    beforeEach(function() {
        angular.mock.module('mapper');
        mockOntologyManager();
        mockMapperState();
        mockUtil();
        mockPrefixes();
        injectHighlightFilter();
        injectTrustedFilter();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _mapperStateService_, _utilService_, _prefixes_, _splitIRIFilter_, _$q_) {
            $compile = _$compile_;
            $q = _$q_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            mapperStateSvc = _mapperStateService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            splitIRI = _splitIRIFilter_;
        });

        let commitObj = {};
        commitObj[prefixes.delim + 'sourceCommit'] = [{'@id': 'sourceCommit'}];
        mapperStateSvc.mapping = {
            name: '',
            ontology: {'@id': 'https://www.example.com'},
            jsonld: [commitObj]
        };

        scope.selectedClass = undefined;
        scope.isDisabledWhen = false;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<class-select selected-class="selectedClass" change-event="changeEvent(value)" is-disabled-when="isDisabledWhen"></class-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('classSelect');
    });

    afterEach(function() {
        $compile = null;
        $q = null;
        scope = null;
        ontologyManagerSvc = null;
        mapperStateSvc = null;
        utilSvc = null;
        prefixes = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('selectedClass should be one way bound', function() {
            this.controller.selectedClass = {};
            scope.$digest();
            expect(scope.selectedClass).toBeUndefined();
        });
        it('isDisabledWhen should be one way bound', function() {
            this.controller.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
        it('changeEvent should be called in the parent scope', function() {
            this.controller.changeEvent({value: {}});
            expect(scope.changeEvent).toHaveBeenCalledWith({});
        });
    });
    describe('controller methods', function() {
        it('should get the ontology id of a class', function() {
            expect(this.controller.getOntologyId({ontologyId: 'test'})).toEqual('test');
            expect(splitIRI).not.toHaveBeenCalled();

            splitIRI.and.returnValue({begin: 'test'});
            expect(this.controller.getOntologyId({classObj: {'@id': ''}})).toEqual('test');
            expect(splitIRI).toHaveBeenCalledWith('');
        });
        describe('should set the class list for the select', function() {
            beforeEach(function() {
                this.ontologyId = 'https://www.example.com';
                ontologyManagerSvc.retrieveClasses.and.returnValue($q.when({'https://www.example.com': {'results': {'bindings': returnedClasses}}}));
                spyOn(this.controller, 'getOntologyId').and.returnValue(this.ontologyId);
            });
            it('if search text is provided', function() {
                this.controller.setClasses('test');
                scope.$apply();
                expect(ontologyManagerSvc.retrieveClasses).toHaveBeenCalledWith(this.ontologyId, '', 'sourceCommit', '100', 'test', 'class-dropdown');
                expect(this.controller.selectClasses).toEqual([
                    {
                        classObj: {'@id': 'class1', '@type': 'http://www/w3/org/2002/07/owl#Class', 'description': 'description1', 'name': 'class1'},
                        ontologyId: this.ontologyId,
                        isDeprecated: false,
                        groupHeader: this.ontologyId
                    },
                    {
                        classObj: {'@id': 'class2', '@type': 'http://www/w3/org/2002/07/owl#Class', 'description': 'description2', 'name': 'class2'},
                        ontologyId: this.ontologyId,
                        isDeprecated: false,
                        groupHeader: this.ontologyId
                    },
                    {
                        classObj: {'@id': 'class3', '@type': 'http://www/w3/org/2002/07/owl#Class', 'description': 'description3', 'name': 'class3'},
                        ontologyId: this.ontologyId,
                        isDeprecated: true,
                        groupHeader: this.ontologyId
                    }
                ]);
            });
            it('if no search text is provided', function() {
                this.controller.setClasses('');
                scope.$apply();
                expect(ontologyManagerSvc.retrieveClasses).toHaveBeenCalledWith(this.ontologyId, '', 'sourceCommit', '100', '', 'class-dropdown');
                expect(this.controller.selectClasses).toEqual([
                    {
                        classObj: {'@id': 'class1', '@type': 'http://www/w3/org/2002/07/owl#Class', 'description': 'description1', 'name': 'class1'},
                        ontologyId: this.ontologyId,
                        isDeprecated: false,
                        groupHeader: this.ontologyId
                    },
                    {
                        classObj: {'@id': 'class2', '@type': 'http://www/w3/org/2002/07/owl#Class', 'description': 'description2', 'name': 'class2'},
                        ontologyId: this.ontologyId,
                        isDeprecated: false,
                        groupHeader: this.ontologyId
                    },
                    {
                        classObj: {'@id': 'class3', '@type': 'http://www/w3/org/2002/07/owl#Class', 'description': 'description3', 'name': 'class3'},
                        ontologyId: this.ontologyId,
                        isDeprecated: true,
                        groupHeader: this.ontologyId
                    }
                ]);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CLASS-SELECT');
            expect(this.element.querySelectorAll('.class-select').length).toEqual(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toEqual(1);
        });
    });
});
