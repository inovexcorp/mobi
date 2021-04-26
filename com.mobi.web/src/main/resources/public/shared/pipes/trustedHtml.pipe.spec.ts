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