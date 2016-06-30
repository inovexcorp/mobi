package org.matonto.itests;

/*-
 * #%L
 * org.matonto.itests
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.Bundle;

import static org.junit.Assert.assertEquals;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class RepositoryIT extends KarafTestSupport {

    private static boolean setUpIsDone = false;

    @Before
    public void setup() throws Exception {
        if (setUpIsDone) {
            return;
        }

        installAndAssertFeature("obr");
        installAndAssertFeature("scr");

        System.out.println(executeCommand("obr:url-add http://obr.matonto.org:8181/cave/matonto-deps-repository.xml"));
        System.out.println(executeCommand("obr:url-add http://obr.matonto.org:8181/cave/matonto-releases-repository.xml"));
        System.out.println(executeCommand("obr:url-add http://nexus.inovexcorp.com/nexus/content/shadows/matonto-snapshots-obr/.meta/obr.xml"));

        installBundle("mvn:org.matonto/persistence.api/1.0.0-SNAPSHOT");
        installBundle("mvn:org.matonto/rdf.impl.sesame/1.0.0-SNAPSHOT");
        installBundle("mvn:org.matonto/repository.impl.sesame/1.0.0-SNAPSHOT");

        System.out.println(executeCommand("obr:start org.matonto.repository.impl.sesame"));
        System.out.println(executeCommand("bundle:list"));

        setUpIsDone = true;
    }

    @Test
    public void bundleActivates() throws Exception {
        assertEquals(findBundleByName("org.matonto.repository.impl.sesame").getState(), Bundle.ACTIVE);
    }
}
