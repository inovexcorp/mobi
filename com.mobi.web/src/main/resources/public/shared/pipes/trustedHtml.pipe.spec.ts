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
import { TrustedHtmlPipe } from './trustedHtml.pipe';
import { TestBed, inject } from "@angular/core/testing";
import { DomSanitizer } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';

describe('Trusted HTML pipe', () => {
    let pipe:TrustedHtmlPipe;
    let pipeMode = null;
    let sanitizer: DomSanitizer;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            declarations: [TrustedHtmlPipe],
            imports: []
        }).compileComponents();
    });

    beforeEach(inject([DomSanitizer], (sanitzr: DomSanitizer) => {
        pipe = new TrustedHtmlPipe(sanitzr);
        sanitizer = sanitzr;
        pipeMode = 'html';
    }))

    it('Pipe instance created', () => {
        expect(pipe).toBeTruthy();
    });

    it('returns safe HTML', function() {
        let customHTML = `<b onmouseover=alert('Wufff!')>click me!</b><script>alert('hello')</script>`;
        const safeHTML : any = pipe.transform(customHTML, pipeMode);
        expect(safeHTML['changingThisBreaksApplicationSecurity']).toEqual(`<b>click me!</b>`)
    });
});
