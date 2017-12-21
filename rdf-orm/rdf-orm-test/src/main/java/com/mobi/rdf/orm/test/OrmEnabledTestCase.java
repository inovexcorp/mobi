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
 * This base test class will allow developers writing unit tests making use of ORM-based structures to work with the
 * ORM system outside of OSGi (i.e. in their JUnit environment).  Basically it will scan the classpath for any
 * <b>ormFactories.conf</b> and <b>valueConverters.conf</b> files, and will load the specified components in and
 * configure the environment so that your OrmFactories and ValueConverters intialize as they would in the OSGi system.
 */
public class OrmEnabledTestCase {

    protected static final ModelFactory MF = new LinkedHashModelFactoryService();

    protected static final ValueFactory VF = new ValueFactoryService();

    protected static final OrmFactoryRegistryImpl OFR = new OrmFactoryRegistryImpl();

    protected static final ValueConverterRegistry valueConverterRegistry = new DefaultValueConverterRegistry();

    protected static final List<ValueConverter<?>> valueConverters = new ArrayList<>();

    protected static final List<OrmFactory<?>> ormFactories = new ArrayList<>();

    /**
     * Static constructor loads and processes the specified configuration files.
     */
    static {
        loadComponents("valueConverters.conf", ValueConverter.class, valueConverters);
        loadComponents("ormFactories.conf", OrmFactory.class, ormFactories);
    }

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
            final Enumeration<URL> resources = ClassLoader.getSystemClassLoader().getResources(fileName);
            while (resources.hasMoreElements()) {
                final URL resource = resources.nextElement();
                for (final Class<?> clazz : loadSpecifiedClasses(resource.openStream())) {
                    // If the specific class is of the correct type.
                    if (type.isAssignableFrom(clazz)) {
                        // If the collection doesn't have an instance of this class yet...
                        if (coll.stream().map(Object::getClass).noneMatch(clazz::equals)) {
                            coll.add(clazz.getConstructor().newInstance());
                        }
                    } else {
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
            set.addAll(br.lines().filter(StringUtils::isNotBlank).map(name -> {
                try {
                    return ClassLoader.getSystemClassLoader().loadClass(name);
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }).collect(Collectors.toSet()));

        }
        return set;
    }


    private static void registerOrmFactory(OrmFactory<?> factory) throws RuntimeException {
        try {
            Method m = OrmFactoryRegistryImpl.class.getDeclaredMethod("addFactory", OrmFactory.class);
            m.setAccessible(true);
            m.invoke(OFR, factory);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


}
