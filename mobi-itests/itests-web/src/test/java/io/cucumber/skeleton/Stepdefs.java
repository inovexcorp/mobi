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

import static io.cucumber.skeleton.Hooks.driver;

import cucumber.api.java.en.And;
import cucumber.api.java.en.Given;
import cucumber.api.java.en.When;
import org.openqa.selenium.By;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebElement;


public class Stepdefs {

    @Given("I navigate to the Mobi login page")
    public void INavigateToTheMobiLoginPage() {
        driver.get(Hooks.testURL);
    }

    @When("I log in with the {string} username and {string} password")
    public void ILogInWithTheUsernameAndPassword(String username, String password){
        By usernameField = By.id("username");
        Selenide.WaitTillElementIsVisible(usernameField);
        WebElement usernameElement = driver.findElement(usernameField);
        usernameElement.sendKeys(username);
        WebElement passwordElement = driver.findElement(By.id("password"));
        passwordElement.sendKeys(password);
        Selenide.WaitTillElementIsVisible(By.xpath("//button[@type='submit'][text()[contains(.,'Login')]]"));
        WebElement logInButton = driver.findElement(By.xpath("//button[@type='submit'][text()[contains(.,'Login')]]"));
        logInButton.click();
        Selenide.WaitTillElementIsVisible(By.xpath("//li[contains(@class, 'active')]/a[@class='nav-link']/span[text()[contains(.,'Home')]]"));
    }


    @And("the {string} page's action elements are visible")
    public void thePageSStandardElementsAreVisible(String sidebarPageName) throws Exception {
        switch (sidebarPageName) {
            case "Home":
                Selenide.WaitTillElementIsVisible(By.xpath("//*[contains(@class, 'quick-action-grid')]//span[text()[contains(.,'Search the Catalog')]]"));
                Selenide.WaitTillElementIsVisible(By.xpath("//*[contains(@class, 'quick-action-grid')]//span[text()[contains(.,'Open an Ontology')]]"));
                Selenide.WaitTillElementIsVisible(By.xpath("//*[contains(@class, 'quick-action-grid')]//span[text()[contains(.,'Read the Documentation')]]"));
                Selenide.WaitTillElementIsVisible(By.xpath("//*[contains(@class, 'quick-action-grid')]//span[text()[contains(.,'Explore Data')]]"));
                Selenide.WaitTillElementIsVisible(By.xpath("//*[contains(@class, 'quick-action-grid')]//span[text()[contains(.,'Query Data')]]"));
                Selenide.WaitTillElementIsVisible(By.xpath("//*[contains(@class, 'quick-action-grid')]//span[text()[contains(.,'Ingest Data')]]"));
                Selenide.WaitTillElementIsVisible(By.xpath("//a[@class='nav-link active'][text()[contains(.,'Recent Activity')]]"));
                break;
            case "Catalog":
                Selenide.WaitTillElementIsVisible(By.xpath("//div[contains(@class,'input-group')]/input"));
                break;
            case "Ontology Editor":
                Selenide.WaitTillElementIsVisible(By.xpath("//div[contains(@class, 'ontology-sidebar')]/div/button[text()[contains(.,'Ontologies')]]"));
                Selenide.WaitTillElementIsVisible(By.xpath("//*[contains(@class, 'search-bar')]//input"));
                Selenide.WaitTillElementIsVisible(By.xpath("//button[text()[contains(.,'New Ontology')]]"));
                Selenide.WaitTillElementIsVisible(By.xpath("//button[text()[contains(.,'Upload Ontology')]]"));
                break;
            case "Merge Requests":
                Selenide.WaitTillElementIsVisible(By.xpath("//button[text()[contains(.,'Create Request')]]"));
                break;
            case "Mapping Tool":
                Selenide.WaitTillElementIsVisible(By.xpath("//button[text()[contains(.,'Create Mapping')]]"));
                Selenide.WaitTillElementIsVisible(By.xpath("//i[@class='fa fa-search']/following-sibling::input"));

                break;
            case "Datasets":
                Selenide.WaitTillElementIsVisible(By.xpath("//button[text()[contains(.,'New Dataset')]]"));
                break;
            case "Discover":
                Selenide.WaitTillElementIsVisible(By.xpath("//*[contains(@class, 'material-tabset-headings')]/ul/li/a/span[text()[contains(.,'Explore')]]"));
                Selenide.WaitTillElementIsVisible(By.xpath("//*[contains(@class, 'material-tabset-headings')]/ul/li/a/span[text()[contains(.,'Search')]]"));
                Selenide.WaitTillElementIsVisible(By.xpath("//*[contains(@class, 'material-tabset-headings')]/ul/li/a/span[text()[contains(.,'Query')]]"));
                break;
            default:
                System.out.println("No Sidebar Link given!");
                break;
        }
    }

    @And("I navigate to the {string} page")
    public void iNavigateToThePage(String sidebarPageName) {
        Selenide.WaitTillElementIsVisible(By.xpath("//li/a[@class='nav-link']/span[text()[contains(.,'"+sidebarPageName+"')]]"));
        driver.findElement(By.xpath("//li/a[@class='nav-link']/span[text()[contains(.,'"+sidebarPageName+"')]]")).click();
        try{
            Selenide.WaitTillElementIsVisible(By.xpath("//li[contains(@class, 'active')]/a[@class='nav-link']/span[text()[contains(.,'"+sidebarPageName+"')]]"));
        }
        catch (TimeoutException ex){
            Selenide.WaitTillElementIsVisible(By.xpath("//li[contains(@class, 'active')]/a[@class='nav-link']/span[text()[contains(.,'"+sidebarPageName+"')]]"));
        }

    }

    @And("the user clicks on the Administration sidebar link")
    public void theUserClicksOnTheAdministrationSidebarLink() {
        driver.findElement(By.xpath("//*[@ui-sref='root.user-management']/span[text()[contains(.,'Administration')]]")).click();
    }

    @And("the user clicks the Logout link on the sidebar")
    public void theUserClicksTheLogoutLinkOnTheSidebar() {
        driver.findElement(By.xpath("//i[@class='fa fa-sign-out fa-fw']/following-sibling::span[text()[contains(.,'Logout')]]")).click();
        Selenide.WaitTillElementIsVisible(By.id("username"));
    }
}
