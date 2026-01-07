/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MockProvider } from 'ng-mocks';

import { TrustedHtmlPipe } from './trustedHtml.pipe';

describe('Trusted HTML pipe', () => {
    let pipe:TrustedHtmlPipe;
    let sanitizer: jasmine.SpyObj<DomSanitizer>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ TrustedHtmlPipe ],
            providers: [ MockProvider(DomSanitizer) ],
            imports: []
        }).compileComponents();

        sanitizer = TestBed.inject(DomSanitizer) as jasmine.SpyObj<DomSanitizer>;
        pipe = new TrustedHtmlPipe(sanitizer);
    });

    it('Pipe instance created', () => {
        expect(pipe).toBeTruthy();
    });

    it('returns safe HTML', function() {
        sanitizer.bypassSecurityTrustHtml.and.returnValue('<b>click me!</b>');
        const customHTML = '<b onmouseover=alert(\'Wufff!\')>click me!</b><script>alert(\'hello\')</script>';
        const safeHTML: SafeHtml = pipe.transform(customHTML, 'html');
        expect(safeHTML).toEqual('<b>click me!</b>');
    });
});
