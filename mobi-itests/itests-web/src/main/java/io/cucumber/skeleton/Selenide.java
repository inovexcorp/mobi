package io.cucumber.skeleton;

/*-
 * #%L
 * Mobi-Cucumber-Automation
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

import org.apache.commons.io.FileUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

public class Selenide {
    private static WebDriverWait wait;
    public Selenide(WebDriver driver) {
        wait = new WebDriverWait(driver, 5);
    }
    public static void WaitTillElementIsVisible(By by){
        wait.until(ExpectedConditions.visibilityOfElementLocated(by));
    }

    public static void WaitTillElementIsNotVisible(By by){
        wait.until(ExpectedConditions.invisibilityOfElementLocated(by) );
    }
    public static void JavascriptClick(WebDriver driver, WebElement element) {
        JavascriptExecutor executor = (JavascriptExecutor)driver;
        executor.executeScript("arguments[0].click();", element);
    }

    public static void JavascriptLeaveSiteAlert(WebDriver driver){
        JavascriptExecutor executor = (JavascriptExecutor)driver;
        executor.executeScript("window.alert = function() {};");
    }

    public static void takeTestScreenshot(WebDriver driver){
    File screenshotFile = ((TakesScreenshot)driver).getScreenshotAs(OutputType.FILE);
    String test_screenshot_timestamp = new SimpleDateFormat("yyyy_MM_dd-HH:mm:ss").format(new Date());
        try {
            FileUtils.copyFile(screenshotFile, new File("test_"+test_screenshot_timestamp+".png"));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public void InputDropdownField(WebElement element, String inputText){
        //@TODO Implement InputDropdownField
    }

    public void WaitTillTableLoad(){
        //@TODO Implement WaitTillTableLoad
        String progressBarID= "secondaryProgress";
    }
}
