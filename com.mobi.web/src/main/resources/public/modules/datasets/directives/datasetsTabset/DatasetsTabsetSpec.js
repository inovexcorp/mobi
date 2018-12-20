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
describe('Datasets Tabset directive', function() {
    var $compile, scope, datasetStateSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('datasetsTabset');
        mockDatasetState();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _datasetStateService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            datasetStateSvc = _datasetStateService_;
            modalSvc = _modalService_;
        });

        this.element = $compile(angular.element('<datasets-tabset></dataset-tabset>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('datasetsTabset');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        datasetStateSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    it('should initialize by setting the dataset record results', function() {
        expect(datasetStateSvc.setResults).toHaveBeenCalled();
    });
    describe('controller methods', function() {
        it('should open the newDatasetOverlay', function() {
            this.controller.showNewOverlay();
            expect(modalSvc.openModal).toHaveBeenCalledWith('newDatasetOverlay');
        });
        it('should set the correct state if the enter key is pressed', function() {
            datasetStateSvc.setResults.calls.reset();
            this.controller.onKeyUp({keyCode: 0});
            expect(datasetStateSvc.resetPagination).not.toHaveBeenCalled();
            expect(datasetStateSvc.setResults).not.toHaveBeenCalled();
            expect(datasetStateSvc.submittedSearch).toBeFalsy();

            this.controller.onKeyUp({keyCode: 13});
            expect(datasetStateSvc.resetPagination).toHaveBeenCalled();
            expect(datasetStateSvc.setResults).toHaveBeenCalled();
            expect(datasetStateSvc.submittedSearch).toEqual(!!datasetStateSvc.paginationConfig.searchText);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('datasets-tabset')).toBe(true);
        });
        it('with a .white-bar', function() {
            expect(this.element.querySelectorAll('.white-bar').length).toBe(1);
        });
        it('with datasets-list', function() {
            expect(this.element.find('datasets-list').length).toBe(1);
        });
    });
    it('should call showNewOverlay when the new dataset button is clicked', function() {
        spyOn(this.controller, 'showNewOverlay');
        var button = angular.element(this.element.querySelectorAll('.actions button')[0]);
        button.triggerHandler('click');
        expect(this.controller.showNewOverlay).toHaveBeenCalled();
    });
});