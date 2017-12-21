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
import org.junit.Before;

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

public class OrmEnabledTestCase {


    protected static final ModelFactory MF = new LinkedHashModelFactoryService();

    protected static final ValueFactory VF = new ValueFactoryService();

    protected static final OrmFactoryRegistryImpl OFR = new OrmFactoryRegistryImpl();

    protected static final ValueConverterRegistry valueConverterRegistry = new DefaultValueConverterRegistry();

    protected final List<ValueConverter<?>> valueConverters = new ArrayList<>();

    protected final List<OrmFactory<?>> ormFactories = new ArrayList<>();

    protected OrmEnabledTestCase() {
        loadComponents("valueConverters.conf", ValueConverter.class, valueConverters);
        loadComponents("ormFactories.conf", OrmFactory.class, ormFactories);
    }

    @Before
    public void configureOrmStuff() throws Exception {
        valueConverters.forEach(valueConverterRegistry::registerValueConverter);
        ormFactories.stream().peek(factory -> {
            if (AbstractOrmFactory.class.isAssignableFrom(factory.getClass())) {
                ((AbstractOrmFactory) factory).setModelFactory(MF);
                ((AbstractOrmFactory) factory).setValueConverterRegistry(valueConverterRegistry);
                ((AbstractOrmFactory) factory).setValueFactory(VF);
            }
        }).peek(valueConverterRegistry::registerValueConverter).forEach(this::registerOrmFactory);
    }

    @SuppressWarnings("unchecked")
    private <T> void loadComponents(final String fileName, Class<T> type, List coll) {
        try {
            Enumeration<URL> locs = ClassLoader.getSystemClassLoader().getResources(fileName);
            while (locs.hasMoreElements()) {
                for (Class<?> clazz : loadSpecifiedClasses(locs.nextElement().openStream())) {
                    if (type.isAssignableFrom(clazz)) {
                        if (coll.stream().map(Object::getClass).noneMatch(clazz::equals)) {
                            coll.add(clazz.getConstructor().newInstance());
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            Assert.fail("Failed initializing test: " + e.getMessage());
        }
    }

    private Set<Class<?>> loadSpecifiedClasses(final InputStream is) throws IOException, ClassNotFoundException {
        final Set<Class<?>> set = new HashSet<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is))) {
            set.addAll(br.lines().filter(StringUtils::isNotBlank).map(name -> {
                try {
                    return getClass().getClassLoader().loadClass(name);
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }).collect(Collectors.toSet()));

        }
        return set;
    }


    private void registerOrmFactory(OrmFactory<?> factory) throws RuntimeException {
        try {
            Method m = OrmFactoryRegistryImpl.class.getDeclaredMethod("addFactory", OrmFactory.class);
            m.setAccessible(true);
            m.invoke(OFR, factory);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


}
