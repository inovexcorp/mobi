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

import cucumber.api.Scenario;
import cucumber.api.java.After;
import cucumber.api.java.Before;
import net.masterthought.cucumber.Configuration;
import net.masterthought.cucumber.ReportBuilder;
import net.masterthought.cucumber.Reportable;
import org.apache.commons.io.FileUtils;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class Hooks {

    public static WebDriver driver;
    public static String testURL = "https://localhost:8443/mobi/index.html#/login";
    public int implicitWaitTimeout = 5;
    public Selenide selenide;
    private static boolean dunit;

    @Before
    public void beforeAll(){
        if (!dunit) {
            Runtime.getRuntime().addShutdownHook(new Thread(this::setupCucumberReporting));
            dunit = true;
        }
    }

    @Before
    public void beforeBrowserScenario() {
        ChromeOptions chromeOptions = new ChromeOptions();
        chromeOptions.addArguments("--headless");
        chromeOptions.addArguments("--no-sandbox");
        chromeOptions.addArguments("window-size=1920,1080");
        chromeOptions.setAcceptInsecureCerts(true);
        chromeOptions.addArguments("test-type");
//
//        FirefoxOptions firefoxOptions = new FirefoxOptions();
//        FirefoxProfile firefoxProfile = new FirefoxProfile();
//        firefoxProfile.setAssumeUntrustedCertificateIssuer(false);
////        firefoxOptions.setHeadless(true);
//        firefoxOptions.addArguments("--width=1920 --height=1080");
//        firefoxOptions.setProfile(firefoxProfile);

        driver = new ChromeDriver(chromeOptions);
        driver.manage().timeouts().implicitlyWait(implicitWaitTimeout, TimeUnit.SECONDS); //set overall implicit wait to 10 seconds
        driver.get("about:blank");
        driver.manage().window().fullscreen();
        selenide = new Selenide(driver);
    }

    @After
    public void afterBrowserScenario(Scenario scenario) {
        if (scenario.isFailed()) {
            try {
                File screenshotFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
                String failureScreenshotTimestamp = new SimpleDateFormat("yyyy_MM_dd HH:mm:ss").format(new Date());
                FileUtils.copyFile(screenshotFile, new File("failure_" + failureScreenshotTimestamp + ".png"));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        driver.close();
        driver.quit();
    }

    public void setupCucumberReporting () {
        File reportOutputDirectory = new File("target");
        List<String> jsonFiles = new ArrayList<>();
        jsonFiles.add("cucumber-report-1.json");
        jsonFiles.add("cucumber-report-2.json");

        String buildNumber = "1";
        String projectName = "cucumberProject";
        boolean runWithJenkins = false;

        Configuration configuration = new Configuration(reportOutputDirectory, projectName);
        // optional configuration - check javadoc
        configuration.setRunWithJenkins(runWithJenkins);
        configuration.setBuildNumber(buildNumber);
        // additional metadata presented on main page
        configuration.addClassifications("Platform", "Windows");
        configuration.addClassifications("Browser", "Firefox");
        configuration.addClassifications("Branch", "release/1.0");

        // optionally add metadata presented on main page via properties file
        List<String> classificationFiles = new ArrayList<>();
        classificationFiles.add("properties-1.properties");
        classificationFiles.add("properties-2.properties");
        configuration.addClassificationFiles(classificationFiles);

        ReportBuilder reportBuilder = new ReportBuilder(jsonFiles, configuration);
        Reportable result = reportBuilder.generateReports();
    }
}
