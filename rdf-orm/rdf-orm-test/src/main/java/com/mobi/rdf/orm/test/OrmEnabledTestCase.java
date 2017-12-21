package com.mobi.rdf.orm.test;

/*-
 * #%L
 * rdf-orm-test
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

import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactoryService;
import com.mobi.rdf.core.impl.sesame.ValueFactoryService;
import com.mobi.rdf.orm.AbstractOrmFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.conversion.ValueConverter;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.impl.OrmFactoryRegistryImpl;
import org.apache.commons.lang.StringUtils;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Method;
import java.net.URL;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * This abstract test-class will provide the boiler-plate logic to more easily initialize the backing configuration
 * of an ORM-enabled set of classes you intend to test.  Basically, it will scan the classpath for any
 * <b>ormFactories.conf</b> and <b>valueConverters.conf</b> files, and will load the specified components from each
 * instance of the files (any file with the specific name).  It will then inject them with the necessary backing services,
 * and neatly provide normal layers for accessing the structures as you would in the OSGi runtime.
 */
public abstract class OrmEnabledTestCase {

    private static final Logger LOGGER = LoggerFactory.getLogger(OrmEnabledTestCase.class);

    protected static final ModelFactory MF = new LinkedHashModelFactoryService();

    protected static final ValueFactory VF = new ValueFactoryService();

    protected static final OrmFactoryRegistryImpl OFR = new OrmFactoryRegistryImpl();

    protected static final ValueConverterRegistry valueConverterRegistry = new DefaultValueConverterRegistry();

    protected static final List<ValueConverter<?>> valueConverters = new ArrayList<>();

    protected static final List<OrmFactory<?>> ormFactories = new ArrayList<>();

    protected static final Set<URL> confLocations = new HashSet<>();

    /**
     * Static constructor loads and processes the specified configuration files.
     */
    static {
        loadComponents("valueConverters.conf", ValueConverter.class, valueConverters);
        loadComponents("ormFactories.conf", OrmFactory.class, ormFactories);
        LOGGER.info("Discovered the following configuration locations");
        confLocations.stream().map(URL::toString).map(OrmEnabledTestCase::tab).forEach(LOGGER::info);
    }

    /**
     * Before the test-case class actually starts up, wire together the configured components.
     *
     * @throws Exception If there is an issue configuring the various injected objects
     */
    @BeforeClass
    public static void configureOrmStuff() throws Exception {
        valueConverters.forEach(valueConverterRegistry::registerValueConverter);
        ormFactories.stream().peek(factory -> {
            if (AbstractOrmFactory.class.isAssignableFrom(factory.getClass())) {
                ((AbstractOrmFactory) factory).setModelFactory(MF);
                ((AbstractOrmFactory) factory).setValueConverterRegistry(valueConverterRegistry);
                ((AbstractOrmFactory) factory).setValueFactory(VF);
            }
        }).peek(valueConverterRegistry::registerValueConverter).forEach(OrmEnabledTestCase::registerOrmFactory);
    }

    @SuppressWarnings("unchecked")
    private static <T> void loadComponents(final String fileName, Class<T> type, List coll) {
        try {
            // Find every occurrence of files with the required name.
            final Enumeration<URL> resources = ClassLoader.getSystemClassLoader().getResources(fileName);
            // Iterate over them.
            while (resources.hasMoreElements()) {
                final URL resource = resources.nextElement();
                confLocations.add(resource);
                for (final Class<?> clazz : loadSpecifiedClasses(resource.openStream())) {
                    // If the specific class is of the correct type.
                    if (type.isAssignableFrom(clazz)) {
                        // If the collection doesn't have an instance of this class yet...
                        if (coll.stream().map(Object::getClass).noneMatch(clazz::equals)) {
                            coll.add(clazz.getConstructor().newInstance());
                        }
                    } else {
                        // Fail if we find a class of the incorrect type in the list.
                        throw new RuntimeException("Class '" + clazz.getName() + "' specified in '"
                                + resource.toString() + "' isn't of correct type: " + type.getName());
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            Assert.fail("Failed initializing test: " + e.getMessage());
        }
    }

    private static Set<Class<?>> loadSpecifiedClasses(final InputStream is) throws IOException, ClassNotFoundException {
        final Set<Class<?>> set = new HashSet<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is))) {
            // For each non-blank line.
            set.addAll(br.lines().filter(StringUtils::isNotBlank).map(name -> {
                // Map to the class.
                try {
                    return ClassLoader.getSystemClassLoader().loadClass(name);
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            })
                    // Collect to a set of classes specified in this file.
                    .collect(Collectors.toSet()));

        }
        return set;
    }

    private static void registerOrmFactory(OrmFactory<?> factory) throws RuntimeException {
        try {
            // Reflectively register an OrmFactory in our factory registry.
            Method m = OrmFactoryRegistryImpl.class.getDeclaredMethod("addFactory", OrmFactory.class);
            m.setAccessible(true);
            m.invoke(OFR, factory);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static String tab(String in) {
        return String.format("\t%s", in);
    }
}