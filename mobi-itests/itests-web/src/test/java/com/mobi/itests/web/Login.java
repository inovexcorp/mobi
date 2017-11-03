package com.mobi.itests.web;

/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.concurrent.TimeUnit;

@RunWith(Parameterized.class)
public class Login {

    private String browser;
    private WebDriver driver;

    @Parameterized.Parameters
    public static Object[] data() {
        return new Object[] {"firefox", "chrome"};
    }

    public Login(String browser) {
        this.browser = browser;
    }

    @Before
    public void setUp() throws Exception {
        driver = WebSuiteIT.getDriver(browser);
        driver.manage().timeouts().implicitlyWait(60, TimeUnit.SECONDS);
    }
    
    @Test
    public void LoginTest() throws Exception {
        driver.get(WebSuiteIT.url);
        WebElement username = new WebDriverWait(driver, 10)
                .until(ExpectedConditions.visibilityOfElementLocated(By.id("username")));
        username.click();
        username.clear();
        username.sendKeys("admin");
        WebElement password = new WebDriverWait(driver, 10)
                .until(ExpectedConditions.visibilityOfElementLocated(By.id("password")));
        password.click();
        password.clear();
        password.sendKeys("admin");
        driver.findElement(By.xpath("//section/div/div/form/button")).click();
        new WebDriverWait(driver, 10).until(ExpectedConditions.titleIs("Home | Mobi"));
    }
    
    @After
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
