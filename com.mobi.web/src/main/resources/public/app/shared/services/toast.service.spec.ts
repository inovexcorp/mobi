/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { ToastrService } from 'ngx-toastr';

import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { ToastService } from './toast.service';

describe('Toast service', function() {
    let service: ToastService;
    let toastrStub: jasmine.SpyObj<ToastrService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                ToastService,
                MockProvider(ToastrService),
            ]
        });

        service = TestBed.inject(ToastService);
        toastrStub = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        toastrStub = null;
    });

    it('should create an error toast', function() {
        service.createErrorToast('Text');
        expect(toastrStub.error).toHaveBeenCalledWith('Text', 'Error', {timeOut: 3000});
    });
    it('should create a success toast', function() {
        service.createSuccessToast('Text');
        expect(toastrStub.success).toHaveBeenCalledWith('Text', 'Success', {timeOut: 3000});
    });
    describe('should create a warning toast', function() {
        it('with provided config', function() {
            service.createWarningToast('Text', {timeOut: 10000});
            expect(toastrStub.warning).toHaveBeenCalledWith('Text', 'Warning', {timeOut: 10000});
        });
        it('with default config', function() {
            service.createWarningToast('Text');
            expect(toastrStub.warning).toHaveBeenCalledWith('Text', 'Warning', {timeOut: 3000});
        });
    });
});