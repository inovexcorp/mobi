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
describe('Mapping List Block component', function() {
    var $compile, scope, $q, utilSvc, mappingManagerSvc, mapperStateSvc, catalogManagerSvc, prefixes, modalSvc;

    beforeEach(function() {
        module('templates');
        module('mapper');
        mockPrefixes();
        mockUtil();
        mockMappingManager();
        mockMapperState();
        mockCatalogManager();
        mockModal();
        injectSplitIRIFilter();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _utilService_, _mappingManagerService_, _mapperStateService_, _catalogManagerService_, _prefixes_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            utilSvc = _utilService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            catalogManagerSvc = _catalogManagerService_;
            prefixes = _prefixes_;
            modalSvc = _modalService_;
        });

        this.catalogId = 'catalog';
        catalogManagerSvc.localCatalog = {'@id': this.catalogId};
        this.sortOption = {field: 'http://purl.org/dc/terms/title', asc: true};
        catalogManagerSvc.sortOptions = [this.sortOption];
        this.element = $compile(angular.element('<mapping-list-block></mapping-list-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mappingListBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        utilSvc = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        catalogManagerSvc = null;
        prefixes = null;
        modalSvc = null;
        this.element.remove();
    });

    it('should initialize the list of mapping records', function() {
        expect(catalogManagerSvc.getRecords).toHaveBeenCalled();
    });
    describe('controller methods', function() {
        it('should open the create mapping overlay', function() {
            this.controller.createMapping();
            expect(mapperStateSvc.mapping).toBeUndefined();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createMappingOverlay');
        });
        it('should confirm deleting a mapping', function() {
            mapperStateSvc.mapping = {record: {title: 'title'}};
            this.controller.confirmDeleteMapping();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure'), this.controller.deleteMapping);
        });
        describe('should delete a mapping', function() {
            beforeEach(function () {
                mapperStateSvc.mapping = {record: {id: 'id'}};
                this.mapping = angular.copy(mapperStateSvc.mapping);
                mapperStateSvc.sourceOntologies = [{}];
            });
            it('unless an error occurs', function() {
                mappingManagerSvc.deleteMapping.and.returnValue($q.reject('Error message'));
                this.controller.deleteMapping();
                scope.$apply();
                expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(this.mapping.record.id);
                expect(mapperStateSvc.mapping).toEqual(this.mapping);
                expect(mapperStateSvc.sourceOntologies).toEqual([{}]);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            describe('and retrieve records again', function() {
                it('unless an error occurs', function() {
                    catalogManagerSvc.getRecords.and.returnValue($q.reject('Error message'));
                    this.controller.deleteMapping();
                    scope.$apply();
                    expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(this.mapping.record.id);
                    expect(mapperStateSvc.mapping).toBeUndefined();
                    expect(mapperStateSvc.sourceOntologies).toEqual([]);
                    expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(this.catalogId, {pageIndex: 0, limit: 0, recordType: prefixes.delim + 'MappingRecord', sortOption: this.sortOption});
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
                });
                it('successfully', function() {
                    var record = {
                        '@id': 'record',
                        [prefixes.catalog + 'keyword']: [{'@value': 'keyword'}]
                    };
                    catalogManagerSvc.getRecords.and.returnValue($q.when({data: [record]}));
                    this.controller.deleteMapping();
                    scope.$apply();
                    expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(this.mapping.record.id);
                    expect(mapperStateSvc.mapping).toBeUndefined();
                    expect(mapperStateSvc.sourceOntologies).toEqual([]);
                    expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(this.catalogId, {pageIndex: 0, limit: 0, recordType: prefixes.delim + 'MappingRecord', sortOption: this.sortOption});
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(record, 'title');
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(record, 'description');
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith(record, prefixes.catalog + 'masterBranch');
                    expect(this.controller.list).toContain(jasmine.objectContaining({id: record['@id'], title: jasmine.any(String), description: jasmine.any(String), branch: jasmine.any(String), keywords: ['keyword']}));
                });
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('MAPPING-LIST-BLOCK');
        });
        ['block', 'block-header', 'block-search', 'block-content', 'block-footer'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('with the correct number of mapping list items', function() {
            this.controller.list = [{id: 'record', title: ''}];
            scope.$digest();
            expect(this.element.find('li').length).toBe(this.controller.list.length);
        });
        it('depending on whether the mapping is selected', function() {
            this.controller.list = [{id: 'record', title: ''}];
            scope.$digest();
            var mappingName = angular.element(this.element.querySelectorAll('li a'));
            expect(mappingName.hasClass('active')).toBe(false);

            mapperStateSvc.mapping = {record: {id: 'record'}};
            scope.$digest();
            expect(mappingName.hasClass('active')).toBe(true);
        });
        it('depending on the mapping search string', function() {
            this.controller.list = [{id: 'test1', title: 'Test 1'}, {id: 'test2', title: 'Test 2'}];
            mapperStateSvc.mappingSearchString = 'Test 1';
            scope.$digest();
            expect(this.element.find('li').length).toBe(1);

            mapperStateSvc.mappingSearchString = 'Test 12';
            scope.$digest();
            expect(this.element.find('li').length).toBe(0);
        });
    });
    it('should call mapperStateService selectMapping when a mapping name is clicked', function() {
        this.controller.list = [{id: 'record', title: ''}];
        scope.$digest();

        angular.element(this.element.querySelectorAll('li a')[0]).triggerHandler('click');
        expect(mapperStateSvc.selectMapping).toHaveBeenCalled();
    });
});