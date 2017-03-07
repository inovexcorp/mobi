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
describe('Mapping List directive', function() {
    var $compile,
        scope,
        $q,
        element,
        controller,
        utilSvc,
        mappingManagerSvc,
        mapperStateSvc,
        catalogManagerSvc,
        prefixes;

    beforeEach(function() {
        module('templates');
        module('mappingList');
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

        catalogManagerSvc.localCatalog = {'@id': ''};
        mappingManagerSvc.mappingIds = ['test1'];
        element = $compile(angular.element('<mapping-list></mapping-list>'))(scope);
        scope.$digest();
        controller = element.controller('mappingList');
    });

    describe('controller methods', function() {
        describe('should open a mapping on click', function() {
            it('if it was already open', function() {
                controller.onClick('test1');
                scope.$apply();

                mappingManagerSvc.getMapping.calls.reset();
                controller.onClick('test1');
                expect(mappingManagerSvc.getMapping).not.toHaveBeenCalled();
                expect(mapperStateSvc.mapping).toEqual({jsonld: [], id: 'test1', record: {}});
            });
            describe('if it had not been opened yet', function() {
                it('unless an error occurs', function() {
                    mappingManagerSvc.getMapping.and.returnValue($q.reject('Error message'));
                    controller.onClick('test1');
                    scope.$apply();
                    expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith('test1');
                    expect(mapperStateSvc.mapping).toBeUndefined();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Mapping test1 could not be found');
                });
                it('successfully', function() {
                    var record = {
                        '@id': '',
                        '@type': []
                    };
                    record[prefixes.dcterms + 'title'] = '';
                    record[prefixes.dcterms + 'description'] = '';
                    record[prefixes.dcterms + 'issued'] = '';
                    record[prefixes.dcterms + 'modified'] = '';
                    record[prefixes.catalog + 'keyword'] = '';
                    catalogManagerSvc.getRecord.and.returnValue($q.when(record));
                    controller.onClick('test1');
                    scope.$apply();
                    expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith('test1');
                    expect(catalogManagerSvc.getRecord).toHaveBeenCalled();
                    expect(mapperStateSvc.mapping).toEqual({jsonld: [], id: 'test1', record: record});
                });
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('mapping-list')).toBe(true);
            expect(element.hasClass('tree')).toBe(true);
        });
        it('with the correct number of mapping list items', function() {
            expect(element.find('li').length).toBe(mappingManagerSvc.mappingIds.length);
        });
        it('depending on whether the mapping is selected', function() {
            var mappingName = angular.element(element.querySelectorAll('li a'));
            expect(mappingName.hasClass('active')).toBe(false);

            mapperStateSvc.mapping = {id: 'test1'};
            scope.$digest();
            expect(mappingName.hasClass('active')).toBe(true);
        });
        it('depending on the mapping search string', function() {
            mappingManagerSvc.mappingIds = ['test1', 'test2'];
            mapperStateSvc.mappingSearchString = 'test1';
            scope.$digest();
            expect(element.find('li').length).toBe(1);

            mapperStateSvc.mappingSearchString = 'test12';
            scope.$digest();
            expect(element.find('li').length).toBe(0);
        });
    });
    it('should call onClick when a mapping name is clicked', function() {
        spyOn(controller, 'onClick');
        angular.element(element.querySelectorAll('li a')[0]).triggerHandler('click');
        expect(controller.onClick).toHaveBeenCalled();
    });
});