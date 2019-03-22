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
describe('Class Block component', function() {
    var $compile, scope, discoverStateSvc;

    beforeEach(function() {
        module('templates');
        module('explore');
        mockComponent('explore', 'classBlockHeader');
        mockComponent('explore', 'classCards');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
        });

        this.element = $compile(angular.element('<class-block></class-block>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('CLASS-BLOCK');
        });
        ['block', 'block-header', 'class-block-header', 'block-content'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
        it('with a .padding and info-message', function() {
            expect(this.element.querySelectorAll('.padding').length).toBe(1);
            expect(this.element.find('info-message').length).toBe(1);

            discoverStateSvc.explore.recordId = 'recordId';
            discoverStateSvc.explore.classDetails = [{}];
            scope.$digest();

            expect(this.element.querySelectorAll('.padding').length).toBe(0);
            expect(this.element.find('info-message').length).toBe(0);
        });
        it('with a .text-warning and .fa-exclamation-circle', function() {
            expect(this.element.querySelectorAll('.text-warning').length).toBe(0);
            expect(this.element.querySelectorAll('.fa-exclamation-circle').length).toBe(0);

            discoverStateSvc.explore.recordId = 'recordId';
            scope.$digest();

            expect(this.element.querySelectorAll('.text-warning').length).toBe(1);
            expect(this.element.querySelectorAll('.fa-exclamation-circle').length).toBe(1);
        });
        it('with a .class-cards-container and class-cards', function() {
            expect(this.element.querySelectorAll('.class-cards-container').length).toBe(0);
            expect(this.element.find('class-cards').length).toBe(0);

            discoverStateSvc.explore.recordId = 'recordId';
            discoverStateSvc.explore.classDetails = [{}];
            scope.$digest();

            expect(this.element.querySelectorAll('.class-cards-container').length).toBe(1);
            expect(this.element.find('class-cards').length).toBe(1);
        });
    });
});