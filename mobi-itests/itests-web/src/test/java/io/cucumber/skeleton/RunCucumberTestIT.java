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

import static org.junit.Assert.assertTrue;

import com.mobi.itests.support.KarafTestSupport;
import cucumber.api.CucumberOptions;
import cucumber.api.junit.Cucumber;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.JUnitCore;
import org.junit.runner.RunWith;
import org.ops4j.pax.exam.junit.PaxExamServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RunCucumberTestIT extends KarafTestSupport {

    private static Logger logger = LoggerFactory.getLogger(RunCucumberTestIT.class);

    @Rule
    public PaxExamServer exam = new PaxExamServer();

    @Test
    public void runAcceptanceTests() throws Exception {
        logger.debug("System-under-test created. Running acceptance tests.");
        assertTrue(JUnitCore.runClasses(InnerCucumberTestRunner.class).wasSuccessful());
    }

    @RunWith(Cucumber.class)
    @CucumberOptions(
        plugin = {"pretty", "json:target/cucumber-report.json"},
        monochrome = true)
    public static class InnerCucumberTestRunner {

    }

}