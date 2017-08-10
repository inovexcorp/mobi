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
describe('Datasets Tabset directive', function() {
    var $compile,
        scope,
        element,
        controller,
        datasetStateSvc;

    beforeEach(function() {
        module('templates');
        module('datasetsTabset');
        mockDatasetState();

        inject(function(_$compile_, _$rootScope_, _datasetStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            datasetStateSvc = _datasetStateService_;
        });

        element = $compile(angular.element('<datasets-tabset></dataset-tabset>'))(scope);
        scope.$digest();
        controller = element.controller('datasetsTabset');
    });

    it('should initialize by setting the dataset record results', function() {
        expect(datasetStateSvc.setResults).toHaveBeenCalled();
    });
    describe('controller methods', function() {
        it('should set the correct state if the enter key is pressed', function() {
            datasetStateSvc.setResults.calls.reset();
            controller.onKeyUp({keyCode: 0});
            expect(datasetStateSvc.resetPagination).not.toHaveBeenCalled();
            expect(datasetStateSvc.setResults).not.toHaveBeenCalled();

            controller.onKeyUp({keyCode: 13});
            expect(datasetStateSvc.resetPagination).toHaveBeenCalled();
            expect(datasetStateSvc.setResults).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('datasets-tabset')).toBe(true);
        });
        it('with a .blue-bar', function() {
            expect(element.querySelectorAll('.blue-bar').length).toBe(1);
        });
        it('with a .white-bar', function() {
            expect(element.querySelectorAll('.white-bar').length).toBe(1);
        });
        it('with datasets-list', function() {
            expect(element.find('datasets-list').length).toBe(1);
        });
        it('depending on whether a new dataset is being created', function() {
            expect(element.find('new-dataset-overlay').length).toBe(0);

            datasetStateSvc.showNewOverlay = true;
            scope.$digest();
            expect(element.find('new-dataset-overlay').length).toBe(1);
        });
    });
    it('should set the correct state when the new dataset button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.actions button')[0]);
        button.triggerHandler('click');
        expect(datasetStateSvc.showNewOverlay).toBe(true);
    });
});