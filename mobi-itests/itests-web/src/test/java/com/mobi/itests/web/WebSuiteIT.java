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

import com.mobi.itests.support.KarafTestSupport;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.runner.RunWith;
import org.junit.runners.Suite;
import org.ops4j.pax.exam.junit.PaxExamServer;

@RunWith(Suite.class)
@Suite.SuiteClasses({Login.class})
public class WebSuiteIT extends KarafTestSupport {

    static String url = "https://localhost:" + HTTPS_PORT + "/mobi/index.html";

    @ClassRule
    public static PaxExamServer server = new PaxExamServer();
}
