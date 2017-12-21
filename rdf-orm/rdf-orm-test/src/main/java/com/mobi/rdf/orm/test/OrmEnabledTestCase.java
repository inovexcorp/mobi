package com.mobi.rdf.orm.test;

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
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class OrmEnabledTestCase {


    protected static final ModelFactory MF = new LinkedHashModelFactoryService();

    protected static final ValueFactory VF = new ValueFactoryService();

    protected static final OrmFactoryRegistryImpl OFR = new OrmFactoryRegistryImpl();

    protected ValueConverterRegistry valueConverterRegistry;

    protected final List<ValueConverter<?>> valueConverters = new ArrayList<>();

    protected final List<OrmFactory<?>> ormFactories = new ArrayList<>();


    public OrmEnabledTestCase() {
        loadValueConverters();
        loadOrmFactories();
    }

    @Before
    public void configureOrmStuff() throws Exception {
        valueConverterRegistry = new DefaultValueConverterRegistry();

        valueConverters.forEach(valueConverterRegistry::registerValueConverter);
        ormFactories.stream().peek(factory -> {
            if (AbstractOrmFactory.class.isAssignableFrom(factory.getClass())) {
                ((AbstractOrmFactory) factory).setModelFactory(MF);
                ((AbstractOrmFactory) factory).setValueConverterRegistry(valueConverterRegistry);
                ((AbstractOrmFactory) factory).setValueFactory(VF);
            }
        }).peek(valueConverterRegistry::registerValueConverter).forEach(this::registerOrmFactory);
    }

    private Set<Class<?>> loadSpecifiedClasses(final File target) throws IOException, ClassNotFoundException {
        final Set<Class<?>> set = new HashSet<>();
        try (BufferedReader br = new BufferedReader(new FileReader(target))) {
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

    private void loadValueConverters() {
        try {
            for (Class<?> clazz : loadSpecifiedClasses(new File("src/test/resources/valueConverters.conf")))
                if (ValueConverter.class.isAssignableFrom(clazz)) {
                    valueConverters.add(((ValueConverter) clazz.getConstructor().newInstance()));
                }
        } catch (Exception e) {
            e.printStackTrace();
            Assert.fail("Failed initializing test: " + e.getMessage());
        }
    }

    private void loadOrmFactories() {
        try {
            for (Class<?> clazz : loadSpecifiedClasses(new File("src/test/resources/ormFactories.conf")))
                if (OrmFactory.class.isAssignableFrom(clazz)) {
                    ormFactories.add(((OrmFactory) clazz.getConstructor().newInstance()));
                }
        } catch (Exception e) {
            e.printStackTrace();
            Assert.fail("Failed initializing test: " + e.getMessage());
        }
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
