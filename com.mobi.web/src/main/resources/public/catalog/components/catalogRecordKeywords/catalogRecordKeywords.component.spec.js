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
 */
describe('Catalog Record Keywords component', function() {
    var $compile, scope, $q, catalogManagerSvc, catalogStateSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockCatalogState();
        mockCatalogManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _catalogStateService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        this.catalogId = 'catalogId';
        this.recordId = 'recordId';
        utilSvc.getPropertyId.and.callFake((obj, propId) => {
            if (propId === prefixes.catalog + 'catalog') {
                return this.catalogId;
            }
            return '';
        });
        this.keywords = [{'@value': 'B'}, {'@value': 'A'}];
        scope.record = {
            '@id': this.recordId,
            [prefixes.catalog + 'keyword']: this.keywords
        };
        scope.canEdit = true;
        scope.saveEvent = jasmine.createSpy('saveEvent');
        this.element = $compile(angular.element('<catalog-record-keywords record="record" canEdit="canEdit" save-event="saveEvent(record)"></catalog-record-keywords>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('catalogRecordKeywords');

        catalogManagerSvc.getRecord.and.returnValue($q.when(this.record));
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        catalogStateSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('record should be one way bound', function() {
            this.controller.record = {a: 'b'};
            scope.$digest();
            expect(scope.record).not.toEqual({a: 'b'});
        });
        it('canEdit should be one way bound', function() {
            this.controller.canEdit = false;
            scope.$digest();
            expect(scope.canEdit).toEqual(true);
        });
        it('saveEvent should be called in the parent scope', function() {
            var copy = angular.copy(scope.record);
            this.controller.saveEvent({text: copy});
            expect(scope.saveEvent).toHaveBeenCalledWith(copy);
        });
    });
    describe('initializes correctly', function() {
        it('with keywords', function() {
            expect(this.controller.keywords).toEqual(['A', 'B']);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.record = {
                '@id': this.recordId,
                [prefixes.catalog + 'keyword']: [{'@value': 'C'}, {'@value': 'D'}, {'@value': 'E'}]
            };
        });
        it('saveChanges save the edited keywords', function() {
            this.controller.edit = true;
            this.controller.keywords = ['C', 'D', 'E'];
            this.controller.saveChanges();
            expect(scope.saveEvent).toHaveBeenCalledWith(this.record);
        });
        it('cancelChanges should cancel the keyword edit', function() {
            this.controller.edit = true;
            this.controller.keywords = ['C', 'D', 'E'];
            this.controller.cancelChanges();
            expect(this.controller.keywords).toEqual(['A', 'B']);
            expect(this.controller.edit).toEqual(false);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CATALOG-RECORD-KEYWORDS');
            expect(this.element.querySelectorAll('.catalog-record-keywords').length).toEqual(1);
        });
        it('depending on the number of keywords', function() {
            expect(this.element.querySelectorAll('.keyword').length).toEqual(this.keywords.length);

            this.controller.keywords = [];
            scope.$digest();
            expect(this.element.querySelectorAll('.keyword').length).toEqual(0);
        });
        it('when user is editing', function() {
            this.controller.canEdit = true;
            this.controller.edit = true;
            scope.$digest();
            expect(this.element.querySelectorAll('keyword-select').length).toEqual(1);
            expect(this.element.querySelectorAll('.fa-save').length).toEqual(1);
        });
        it('should set edit to true when clicked', function() {
            this.controller.canEdit = true;
            scope.$digest();

            expect(this.controller.edit).toEqual(false);
            var editableArea = angular.element(this.element.querySelectorAll('.static-area'));
            editableArea.triggerHandler('click');
            expect(this.controller.edit).toEqual(true);
        });
    });
});