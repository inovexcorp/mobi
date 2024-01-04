/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

var AdministrationPage = function() {
    
};

AdministrationPage.prototype.goToPage = function(browser) {
    browser
        .useXpath()
        .waitForElementVisible("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]")
        .click("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]");
};

AdministrationPage.prototype.createUser = function(browser, user) {
    browser
        .useXpath()
        .waitForElementVisible("//button/span[text() [contains(., 'Create User')]]")
        .click("//button/span[text() [contains(., 'Create User')]]")
        .waitForElementVisible("//h1[text() [contains(., 'Create User')]]")
        .useCss()
        .waitForElementVisible("create-user-overlay input[name=unmaskPassword]")
        .click('create-user-overlay input[name=username]')
        .setValue('create-user-overlay input[name=username]', user.username)
        .click('create-user-overlay input[name=unmaskPassword]')
        .setValue('create-user-overlay input[name=unmaskPassword]', user.password)
        .click('create-user-overlay input[name=firstName]')
        .setValue('create-user-overlay input[name=firstName]', user.firstName)
        .click('create-user-overlay input[name=lastName]')
        .setValue('create-user-overlay input[name=lastName]', user.lastName)
        .click('create-user-overlay input[name=email]')
        .setValue('create-user-overlay input[name=email]', user.email)
        .click('label.mat-slide-toggle-label')
        .useXpath()
        .click("//button/span[text() [contains(., 'Submit')]]")
        .waitForElementNotPresent('create-user-overlay')
        .assert.not.elementPresent("//button/span[text() [contains(., 'Submit')]]");
    browser.globals.wait_for_no_spinners(browser);
};

AdministrationPage.prototype.login = function(browser, username, password) {
    browser
        .useXpath()
        .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
        .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
        .setValue('//div[@class="form-group"]//input[@id="username"]', username )
        .setValue('//div[@class="form-group"]//input[@id="password"]', password )
        .click('//button[@type="submit"]');
    browser.globals.wait_for_no_spinners(browser);
    browser.useCss()
        .waitForElementVisible('.home-page');
}

AdministrationPage.prototype.logout = function(browser) {
    browser
        .useXpath()
        .click("//li/a[@class='nav-link']/span[text()[contains(.,'Logout')]]")
        .assert.visible('//div[@class="form-group"]//input[@id="username"]')
        .assert.visible('//div[@class="form-group"]//input[@id="password"]');
}

module.exports = { administrationPage: new AdministrationPage() };
