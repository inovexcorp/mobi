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

import com.mobi.itests.support.KarafTestSupport;
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
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.firefox.FirefoxProfile;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.TimeUnit;

public class Hooks {

    public static WebDriver driver;
    public static String testURL = "https://localhost:" + KarafTestSupport.HTTPS_PORT + "/mobi/index.html#/login";
    public int implicitWaitTimeout = 5;
    public Selenide selenide;
    private static boolean dunit;
    private static SupportedBrowser browser;

    @Before
    public void beforeAll() {
        if (!dunit) {
            Runtime.getRuntime().addShutdownHook(new Thread(this::setupCucumberReporting));
            dunit = true;
        }
    }

    @Before
    public void beforeBrowserScenario() {
        String browserString = System.getProperty("BROWSER");
        if (browser == null) {
            browserString = System.getenv("BROWSER");
            if (browserString == null) {
                browserString = "chrome";
            }
        }
        browser = SupportedBrowser.fromString(browserString);

        switch (browser) {
            case CHROME:
                ChromeOptions chromeOptions = new ChromeOptions();
                chromeOptions.addArguments("--headless");
                chromeOptions.addArguments("--no-sandbox");
                chromeOptions.addArguments("window-size=1920,1080");
                chromeOptions.setAcceptInsecureCerts(true);
                chromeOptions.addArguments("test-type");
                driver = new ChromeDriver(chromeOptions);
                break;
            case FIREFOX:
                FirefoxOptions firefoxOptions = new FirefoxOptions();
                FirefoxProfile firefoxProfile = new FirefoxProfile();
                firefoxProfile.setAssumeUntrustedCertificateIssuer(false);
                firefoxOptions.setHeadless(true);
                firefoxOptions.addArguments("--width=1920 --height=1080");
                firefoxOptions.setProfile(firefoxProfile);
                driver = new FirefoxDriver(firefoxOptions);
                break;
        }

        driver.manage().timeouts().implicitlyWait(implicitWaitTimeout, TimeUnit.SECONDS); //set overall implicit wait to 5 seconds
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
                FileUtils.copyFile(screenshotFile, new File("target/cucumber-screenshots/failure_"
                        + failureScreenshotTimestamp + ".png"));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        driver.close();
        driver.quit();
    }

    private String getCurrentGitBranch() throws IOException, InterruptedException {
        Process process = Runtime.getRuntime().exec( "git rev-parse --abbrev-ref HEAD" );
        process.waitFor();

        BufferedReader reader = new BufferedReader(
                new InputStreamReader( process.getInputStream() ) );

        return reader.readLine();
    }

    private String getBuildNumber() throws IOException {
        InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream("META-INF/maven/dependencies.properties");
        Properties properties = new Properties();
        properties.load(is);
        return properties.getProperty("version");
    }

    private void setupCucumberReporting() {
        File reportOutputDirectory = new File("target");
        List<String> jsonFiles = new ArrayList<>();
        jsonFiles.add("target/cucumber-report.json");

        Configuration configuration = new Configuration(reportOutputDirectory, "Mobi");
        configuration.setRunWithJenkins(false);
        configuration.addClassifications("Platform", System.getProperty("os.name"));
        configuration.addClassifications("Browser", browser.browserName());
        try {
            configuration.addClassifications("Branch", getCurrentGitBranch());
            configuration.setBuildNumber(getBuildNumber());
        } catch (InterruptedException | IOException e) {
            System.err.println("Unable to determine git branch");
        }

        ReportBuilder reportBuilder = new ReportBuilder(jsonFiles, configuration);
        Reportable result = reportBuilder.generateReports();
    }
}
