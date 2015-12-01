package org.matonto.itests;

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
