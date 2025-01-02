package com.mobi.itests.orm;

/*-
 * #%L
 * itests-orm
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.impl.ThingFactory;
import org.apache.karaf.itests.KarafTestSupport;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.ops4j.pax.exam.Configuration;
import org.ops4j.pax.exam.CoreOptions;
import org.ops4j.pax.exam.Option;
import org.ops4j.pax.exam.OptionUtils;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.karaf.options.KarafDistributionOption;
import org.ops4j.pax.exam.options.MavenArtifactUrlReference;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.math.BigInteger;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class OrmIT extends KarafTestSupport {

    private static final Logger LOGGER = LoggerFactory.getLogger(OrmIT.class);

    @Override
    public MavenArtifactUrlReference getKarafDistribution() {
        return CoreOptions.maven().groupId("com.mobi").artifactId("mobi-distribution").versionAsInProject().type("tar.gz");
    }

    @Configuration
    @Override
    public Option[] config() {
        try {
            List<Option> options = new ArrayList<>(Arrays.asList(
                    KarafDistributionOption.replaceConfigurationFile("etc/org.ops4j.pax.logging.cfg",
                            Paths.get(Objects.requireNonNull(this.getClass().getResource("/etc/org.ops4j.pax.logging.cfg")).toURI()).toFile()),
                    KarafDistributionOption.editConfigurationFilePut("etc/com.mobi.security.api.EncryptionService.cfg", "enabled", "false")
            ));

            try (Stream<Path> files = Files.list(getFileResource("/etc").toPath())) {
                files.forEach(path ->
                        options.add(KarafDistributionOption.replaceConfigurationFile("etc/" + path.getFileName(), path.toFile())));
            }
            return OptionUtils.combine(super.config(), options.toArray(new Option[0]));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    protected File getFileResource(String path) throws URISyntaxException {
        URL res = this.getClass().getResource(path);
        if (res == null) {
            throw new RuntimeException("File resource " + path + " not found");
        }
        return Paths.get(res.toURI()).toFile();
    }

    @Test
    public void testConversions() throws Exception {
        ValueConverterRegistry valueConverterRegistry = getOsgiService(ValueConverterRegistry.class);
        ValueFactory vf = new ValidatingValueFactory();
        Thing thing = getOsgiService(ThingFactory.class).createNew(vf.createIRI("urn://thing"));
        //boolean
        testConversion(true, thing, valueConverterRegistry, "Failed working with boolean converter");
        //int
        testConversion(3, thing, valueConverterRegistry, "Integer conversion failure");
        //long
        testConversion(2L, thing, valueConverterRegistry, "Long conversion failure");
        //double
        testConversion(3.14, thing, valueConverterRegistry, "Double conversion failure");
        //float
        testConversion((float) 1.2, thing, valueConverterRegistry, "Float conversion failure");
        //short
        testConversion((short) 3, thing, valueConverterRegistry, "Short conversion failure");
        //string
        testConversion("testing", thing, valueConverterRegistry, "String conversion failure");
        //date
        testConversion(OffsetDateTime.now().truncatedTo(ChronoUnit.SECONDS), thing, valueConverterRegistry,
                "Date conversion failure");
        //IRI
        IRI iri = vf.createIRI("urn:test");
        testConversion(iri, thing, valueConverterRegistry, "IRI conversion failure");
        //Literal
        testConversion(vf.createLiteral("blah"), thing, valueConverterRegistry, "Literal conversion failure");
        //Resource
        testConversion((Resource) vf.createIRI("urn:resource"), thing, valueConverterRegistry, "Resource conversion failure");
        //Value
        testConversion((Value) vf.createLiteral(1.32), thing, valueConverterRegistry, "Value conversion failure");
        //Calendar
        testConversion(new GregorianCalendar(), thing, valueConverterRegistry, "Calendar conversion failure");
        //BigInteger
        BigInteger big = BigInteger.valueOf(123L);
        testConversion(big, thing, valueConverterRegistry, "BigInteger conversion failure");
    }

    private <T> void testConversion(final T type, final Thing thing, final ValueConverterRegistry valueConverterRegistry, final String failureMessage) {
        Value val = valueConverterRegistry.convertType(type, thing);
        T back = (T) valueConverterRegistry.convertValue(val, thing, type.getClass());
        if (type instanceof Calendar) {
            Assert.assertEquals(failureMessage,((Calendar)type).getTime(), ((Calendar)back).getTime());
        } else {
            Assert.assertEquals(failureMessage, type, back);
        }
    }

    @Test
    public void testThingFactory() throws Exception {
        ThingFactory factory = getOsgiService(ThingFactory.class);
        ValueFactory vf = new ValidatingValueFactory();
        IRI test = vf.createIRI("urn://thing");
        Thing thing = factory.createNew(test);
        Assert.assertEquals("IRI mismatch", test, thing.getResource());

        Model m = thing.getModel();
        Thing thing1 = factory.getExisting(test, m).orElseThrow(() -> new Exception("No thing with IRI " + test.stringValue()));
        Assert.assertEquals("IRI mismatch on get", test, thing1.getResource());
    }

}
