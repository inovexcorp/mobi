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
describe('Mapping List Block directive', function() {
    var $compile, scope, $q, element, controller, utilSvc, mappingManagerSvc, mapperStateSvc, catalogManagerSvc, prefixes, catalogId;

    beforeEach(function() {
        module('templates');
        module('mappingListBlock');
        mockPrefixes();
        mockUtil();
        mockMappingManager();
        mockMapperState();
        mockCatalogManager();
        injectSplitIRIFilter();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _utilService_, _mappingManagerService_, _mapperStateService_, _catalogManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            utilSvc = _utilService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            catalogManagerSvc = _catalogManagerService_;
            prefixes = _prefixes_;
        });
        catalogId = 'catalog';
        catalogManagerSvc.localCatalog = {'@id': catalogId};
        element = $compile(angular.element('<mapping-list-block></mapping-list-block>'))(scope);
        scope.$digest();
        controller = element.controller('mappingListBlock');
    });
    it('should initialize the list of mapping records', function() {
        expect(mappingManagerSvc.getMappingRecords).toHaveBeenCalled();
    });
    describe('controller methods', function() {
        it('should open the create mapping overlay', function() {
            controller.createMapping();
            expect(mapperStateSvc.mapping).toBeUndefined();
            expect(mapperStateSvc.displayCreateMappingOverlay).toEqual(true);
        });
        describe('should delete a mapping', function() {
            var mapping;
            beforeEach(function () {
                mapperStateSvc.mapping = {record: {id: 'id'}};
                mapping = angular.copy(mapperStateSvc.mapping);
                mapperStateSvc.sourceOntologies = [{}];
                mapperStateSvc.displayDeleteMappingConfirm = true;
            });
            it('unless an error occurs', function() {
                mappingManagerSvc.deleteMapping.and.returnValue($q.reject('Error message'));
                controller.deleteMapping();
                scope.$apply();
                expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(mapping.record.id);
                expect(mapperStateSvc.displayDeleteMappingConfirm).toEqual(true);
                expect(mapperStateSvc.mapping).toEqual(mapping);
                expect(mapperStateSvc.sourceOntologies).toEqual([{}]);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            describe('and retrieve records again', function() {
                it('unless an error occurs', function() {
                    mappingManagerSvc.getMappingRecords.and.returnValue($q.reject('Error message'));
                    controller.deleteMapping();
                    scope.$apply();
                    expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(mapping.record.id);
                    expect(mapperStateSvc.displayDeleteMappingConfirm).toEqual(false);
                    expect(mapperStateSvc.mapping).toBeUndefined();
                    expect(mapperStateSvc.sourceOntologies).toEqual([]);
                    expect(mappingManagerSvc.getMappingRecords).toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
                });
                it('successfully', function() {
                    var record = {'@id': 'record'};
                    record[prefixes.catalog + 'keyword'] = [{'@value': 'keyword'}];
                    mappingManagerSvc.getMappingRecords.and.returnValue($q.when([record]));
                    controller.deleteMapping();
                    scope.$apply();
                    expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(mapping.record.id);
                    expect(mapperStateSvc.displayDeleteMappingConfirm).toEqual(false);
                    expect(mapperStateSvc.mapping).toBeUndefined();
                    expect(mapperStateSvc.sourceOntologies).toEqual([]);
                    expect(mappingManagerSvc.getMappingRecords).toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(record, 'title');
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(record, 'description');
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith(record, prefixes.catalog + 'masterBranch');
                    expect(controller.list).toContain(jasmine.objectContaining({id: record['@id'], title: jasmine.any(String), description: jasmine.any(String), branch: jasmine.any(String), keywords: ['keyword']}));
                });
            });
        });
        describe('should open a mapping on click', function() {
            var record = {id: 'test1', title: 'Test 1'};
            it('if it was already open', function() {
                controller.onClick(record);
                scope.$apply();

                mappingManagerSvc.getMapping.calls.reset();
                controller.onClick(record);
                expect(mappingManagerSvc.getMapping).not.toHaveBeenCalled();
                expect(mapperStateSvc.mapping).toEqual(jasmine.objectContaining({record: record}));
            });
            describe('if it had not been opened yet', function() {
                it('unless an error occurs', function() {
                    mappingManagerSvc.getMapping.and.returnValue($q.reject('Error message'));
                    controller.onClick(record);
                    scope.$apply();
                    expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith(record.id);
                    expect(mapperStateSvc.mapping).toBeUndefined();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Mapping ' + record.title + ' could not be found');
                });
                it('successfully', function() {
                    var ontology = {'@id': 'ontology'};
                    var mapping = [{}]
                    mappingManagerSvc.getMapping.and.returnValue($q.when(mapping));
                    catalogManagerSvc.getRecord.and.returnValue($q.when(ontology));
                    controller.onClick(record);
                    scope.$apply();
                    expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith(record.id);
                    expect(catalogManagerSvc.getRecord).toHaveBeenCalled();
                    expect(mapperStateSvc.mapping).toEqual({jsonld: mapping, record: record, ontology: ontology, difference: {additions: [], deletions: []}});
                });
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('mapping-list-block')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toEqual(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toEqual(1);
        });
        it('with a block-search', function() {
            expect(element.find('block-search').length).toEqual(1);
        });
        it('with a block-content', function() {
            var blockContent = element.find('block-content');
            expect(blockContent.length).toEqual(1);
            expect(blockContent.hasClass('tree')).toEqual(true);
            expect(blockContent.hasClass('scroll-without-buttons')).toEqual(true);
        });
        it('with a block-footer', function() {
            expect(element.find('block-content').length).toEqual(1);
        });
        it('with the correct number of mapping list items', function() {
            controller.list = [{id: 'record', title: ''}];
            scope.$digest();
            expect(element.find('li').length).toBe(controller.list.length);
        });
        it('depending on whether the mapping is selected', function() {
            controller.list = [{id: 'record', title: ''}];
            scope.$digest();
            var mappingName = angular.element(element.querySelectorAll('li a'));
            expect(mappingName.hasClass('active')).toBe(false);

            mapperStateSvc.mapping = {record: {id: 'record'}};
            scope.$digest();
            expect(mappingName.hasClass('active')).toBe(true);
        });
        it('depending on the mapping search string', function() {
            controller.list = [{id: 'test1', title: 'Test 1'}, {id: 'test2', title: 'Test 2'}];
            mapperStateSvc.mappingSearchString = 'Test 1';
            scope.$digest();
            expect(element.find('li').length).toBe(1);

            mapperStateSvc.mappingSearchString = 'Test 12';
            scope.$digest();
            expect(element.find('li').length).toBe(0);
        });
        it('depending on whether a mapping is being deleted', function() {
            expect(element.find('confirmation-overlay').length).toEqual(0);

            mapperStateSvc.displayDeleteMappingConfirm = true;
            scope.$digest();
            expect(element.find('confirmation-overlay').length).toEqual(1);
        });
    });
    it('should call onClick when a mapping name is clicked', function() {
        controller.list = [{id: 'record', title: ''}];
        spyOn(controller, 'onClick');
        scope.$digest();

        angular.element(element.querySelectorAll('li a')[0]).triggerHandler('click');
        expect(controller.onClick).toHaveBeenCalled();
    });
});