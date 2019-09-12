/*-
 * #%L
 * itests-web
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
module.exports = {
    '@tags': ['mobi', 'login', 'sanity'],
    'Smoke test Mobi' : function (browser) {
        browser
        .url('https://localhost:8443/mobi/')
        .waitForElementVisible('body')
        .setValue('input#username', 'admin')
        .setValue('input#password', 'test')
        .click('button[type=submit]')
        .pause(1000)
        .assert.containsText('.sidebar .current-user-box .user-title', 'admin')
        .end();
    }
};