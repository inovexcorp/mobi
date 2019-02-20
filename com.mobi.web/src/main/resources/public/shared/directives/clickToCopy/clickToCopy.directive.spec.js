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
describe('Click to Copy directive', function() {
    var $compile, scope, toastr;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockToastr();

        inject(function(_$compile_, _$rootScope_, _toastr_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            toastr = _toastr_;
        });

        scope.text = 'text';
        this.element = $compile(angular.element('<div click-to-copy="text"></div>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        toastr = null;
        this.element.remove();
    });

    it('adds the appropriate attributes to the element', function() {
        expect(this.element.attr('click-to-copy')).toBeUndefined();
        expect(this.element.attr('uib-tooltip')).toEqual('Copy to clipboard');
        expect(this.element.attr('ngclipboard')).toEqual('');
        expect(this.element.attr('data-clipboard-text')).toEqual(scope.text);
        expect(this.element.attr('ngclipboard-success')).toEqual('onSuccess()');
    });
    it('updates the clipboard text when the value changes', function() {
        scope.text = 'something else';
        scope.$digest();
        expect(this.element.attr('data-clipboard-text')).toEqual(scope.text);
    });
    it('onSuccess calls correct toastr method', function() {
        scope.onSuccess();
        expect(toastr.success).toHaveBeenCalledWith('', 'Copied', {timeOut: 2000});
    });
});