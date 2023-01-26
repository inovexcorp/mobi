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
import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { REGEX } from '../../constants';

describe('IRI REGEX Validator', function() {
    // Test cases taken from RDF4J ParsedIRITest
    const successCases = [
        'http://test.com',
        'https://test.com',
        'http://1example.com',
        'http://1.example.com',
        'bundleresource://385.fwk19480900/test.ttl',
        'http://example.test/',
        'http://example.test#',
        'http://127.0.0.1/path',
        'http://178.62.246.130',
        'http://127.0.0.1:3333/path',
        'jar:http://example.test/bar/baz.jar!/COM/foo/Quux.class',
        'bundle://159.0:1/org/eclipse/rdf4j/repository/config/system.ttl',
        'jar:file:///some-file.jar!/another-file',
        'jar:file:///some-file.jar!/some-nested-file',
        'http://example.org/up',
        'file:/file.txt',
        'file:///file.txt',
        'file://localhost/file.txt',
        'file:/c:/path/to/file',
        'urn:test:foo',
        'urn:x-evn-master:geo',
        'http://localhost:8080/pipelines/render-html.xpl?result&template=http%3A%2F%2Flocalhost%3A8080%2Fconcept-view.xhtml%3Ftemplate%26realm%3Dhttp%3A%2F%2Flocalhost%3A8080%2F&this=http%3A%2F%2Flocalhost%3A8080%2Fsun&query=view',
        'http://example.com/',
        'http://example.com/dir/dir/',
        'http://example.com/dir/dir/file?qs#frag',
        'http://example.com/dir/dir/file?qs',
        'http://example.com/dir/dir/#frag2',
        'http://example.com/dir/dir/?qs2',
        'http://a/b/c/d;p?q',
        'http://a/b/c/d;p?q#s',
        'http://ab//de//ghi',
        'http://127.0.0.256/',
        'http://385.fwk19480900/test.ttl',
        'http://example.org/poorly%20constructed',
    ];
    const failureCases = [
        '$%^*',
        'file:/c|/path/to/file',
        'http://example.com/?query<',
        'http://example.com/?query>',
        'http://example.com/?query"',
        'http://example.com/?query{',
        'http://example.com/?query}',
        'http://example.com/?query^',
        'http://example.com/?query`',
        'http://example.com/base<',
        'http://example.com/base>',
        'http://example.com/base"',
        'http://example.com/base{',
        'http://example.com/base}',
        'http://example.com/base^',
        'http://example.com/base`',
        'http://example.com/#fragment<',
        'http://example.com/#fragment>',
        'http://example.com/#fragment"',
        'http://example.com/#fragment{',
        'http://example.com/#fragment}',
        'http://example.com/#fragment^',
        'http://example.com/#fragment`',
        'http://example.org:-80/',
        'Just%20some%0AText!?',
        'http://example.org/poorly constructed',
        '100%25'
    ];
    let validator: ValidatorFn;

    beforeEach(function() {
        validator = Validators.pattern(REGEX.IRI);
    });

    afterEach(function() {
        validator = null;
    });

    successCases.forEach(test => {
        it('correctly validates ' + test, function() {
            expect(validator(new FormControl(test))).toBeNull();
        });
    });
    failureCases.forEach(test => {
        it('correctly invalidates ' + test, function() {
            expect(validator(new FormControl(test))).toBeTruthy();
        });
    });
});
