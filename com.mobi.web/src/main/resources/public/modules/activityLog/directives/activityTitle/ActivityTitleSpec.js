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
describe('Activity Title directive', function() {
    var $compile, scope, $q, provManagerSvc, userManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('activityTitle');
        mockProvManager();
        mockUtil();
        mockUserManager();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _provManagerService_, _userManagerService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            provManagerSvc = _provManagerService_;
            userManagerSvc = _userManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        provManagerSvc.activityTypes = [{type: 'type1', word: 'word1', pred: 'pred'}, {type: 'type', word: 'word', pred: 'pred'}];
        scope.activity = { '@type': [], pred: [{'@id': 'entity'}, {'@id': 'entity1'}] };
        scope.entities = [{'@id': 'entity'}, {'@id': 'entity1'}];
    });

    beforeEach(function compile() {
        this.compile = function() {
            this.element = $compile(angular.element('<activity-title activity="activity" entities="entities"></activity-title>'))(scope);
            scope.$apply();
            this.controller = this.element.controller('activityTitle');
            this.isolatedScope = this.element.isolateScope();
        }
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        provManagerSvc = null;
        userManagerSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.compile();
        });
        it('activity is one way bound', function() {
            this.isolatedScope.activity = {};
            scope.$digest();
            expect(scope.activity).toEqual({'@type': [], pred: [{'@id': 'entity'}, {'@id': 'entity1'}]});
        });
        it('entities is one way bound', function() {
            this.isolatedScope.entities = [{}];
            scope.$digest();
            expect(scope.entities).toEqual([{'@id': 'entity'}, {'@id': 'entity1'}]);
        });
    });
    describe('should initialize with the correct value for', function() {
        beforeEach(function() {
            this.compile();
        });
        describe('username', function() {
            it('if the activity does not have the wasAssociatedWith property', function() {
                expect(userManagerSvc.getUsername).not.toHaveBeenCalled();
            });
            describe('if the activity has the wasAssociatedWith property', function() {
                beforeEach(function() {
                    this.iri = 'iri';
                    utilSvc.getPropertyId.and.returnValue(this.iri);
                });
                it('unless an error occurs', function() {
                    userManagerSvc.getUsername.and.returnValue($q.reject('Error message'));
                    this.compile();
                    expect(userManagerSvc.getUsername).toHaveBeenCalledWith(this.iri);
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
                    expect(this.controller.username).toBe('(None)');
                });
                it('successfully', function() {
                    userManagerSvc.getUsername.and.returnValue($q.when('username'));
                    this.compile();
                    expect(userManagerSvc.getUsername).toHaveBeenCalledWith(this.iri);
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    expect(this.controller.username).toBe('username');
                });
            });
        });
        describe('word if the activity is', function() {
            it('a supported type', function() {
                scope.activity['@type'].push('type');
                this.compile();
                expect(this.controller.word).toEqual('word');
            });
            it('more than one supported type', function() {
                scope.activity['@type'] = ['type', 'type1'];
                this.compile();
                expect(this.controller.word).toEqual('word1');
            });
            it('unsupported type', function() {
                expect(this.controller.word).toEqual('affected');
            });
        });
        describe('entities if the activity is', function() {
            beforeEach(function() {
                utilSvc.getDctermsValue.and.callFake(function(obj) {
                    return obj['@id'];
                });
            });
            it('a supported type', function() {
                scope.activity['@type'].push('type');
                this.compile();
                expect(this.controller.entities).toEqual('entity and entity1');
            });
            it('more than one supported type', function() {
                scope.activity['@type'] = ['type', 'type1'];
                this.compile();
                expect(this.controller.entities).toEqual('entity and entity1');
            });
            it('unsupported type', function() {
                expect(this.controller.entities).toEqual('(None)');
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('activity-title')).toBe(true);
            expect(this.element.prop('tagName')).toBe('DIV');
        });
        it('with the active word for the activity', function() {
            this.controller.word = 'word';
            scope.$digest();
            expect(this.element.html()).toContain(this.controller.word);
        });
        it('with the user for the activity', function() {
            this.controller.username = 'user';
            scope.$digest();
            expect(this.element.html()).toContain(this.controller.username);
        });
        it('with the entities for the activity', function() {
            this.controller.entities = '';
            scope.$digest();
            expect(this.element.html()).toContain(this.controller.entities);
        });
    });
});
