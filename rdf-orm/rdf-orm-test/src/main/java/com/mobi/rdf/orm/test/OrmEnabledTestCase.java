package com.mobi.rdf.orm.test;

/*-
 * #%L
 * rdf-orm-test
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.mobi.rdf.orm.AbstractOrmFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverter;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.impl.OrmFactoryRegistryImpl;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang3.reflect.FieldUtils;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.junit.Assert;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * This abstract test-class will provide the boiler-plate logic to more easily initialize the backing configuration
 * of an ORM-enabled set of classes you intend to test.  Basically, it will scan the classpath for any
 * <b>ORM_FACTORIES.conf</b> and <b>VALUE_CONVERTERS.conf</b> files, and will load the specified components from each
 * instance of the files (any file with the specific name).  It will then inject them with the necessary backing services,
 * and neatly provide normal layers for accessing the structures as you would in the OSGi runtime.
 */
public abstract class OrmEnabledTestCase {

    private static final Logger LOGGER = LoggerFactory.getLogger(OrmEnabledTestCase.class);

    protected static final ModelFactory MODEL_FACTORY = new DynamicModelFactory();

    protected static final ValueFactory VALUE_FACTORY = new ValidatingValueFactory();

    protected static final OrmFactoryRegistryImpl ORM_FACTORY_REGISTRY = new OrmFactoryRegistryImpl();

    protected static final ValueConverterRegistry VALUE_CONVERTER_REGISTRY = new DefaultValueConverterRegistry();

    protected static final List<ValueConverter<?>> VALUE_CONVERTERS = new ArrayList<>();

    protected static final List<OrmFactory<?>> ORM_FACTORIES = new ArrayList<>();

    protected static final Set<URL> CONF_LOCATIONS = new HashSet<>();

    /**
     * Static constructor loads and processes the specified configuration files.
     */
    static {
        loadComponents("valueConverters.conf", ValueConverter.class, VALUE_CONVERTERS);
        loadComponents("ormFactories.conf", OrmFactory.class, ORM_FACTORIES);
        LOGGER.info("Discovered the following configuration locations");
        CONF_LOCATIONS.stream().map(URL::toString).map(OrmEnabledTestCase::tab).forEach(LOGGER::info);

        VALUE_CONVERTERS.forEach(VALUE_CONVERTER_REGISTRY::registerValueConverter);
        ORM_FACTORIES.stream()
                .peek(OrmEnabledTestCase::initOrmFactory)
                .peek(VALUE_CONVERTER_REGISTRY::registerValueConverter)
                .forEach(OrmEnabledTestCase::registerOrmFactory);
    }

    /**
     * Loads a file from test resources into the provided repository.
     *
     * @param repository The repository to load data into
     * @param file The filename to load
     * @param rdfFormat The RDFFormat of the file
     * @param contexts Optional contexts to load data into
     */
    public void addData(Repository repository, String file, RDFFormat rdfFormat, Resource... contexts) {
        try (RepositoryConnection conn = repository.getConnection()) {
            InputStream testCatalog = getClass().getResourceAsStream(file);
            try {
                conn.add(testCatalog, rdfFormat, contexts);
            } catch (IOException e) {
                Assert.fail(e.getMessage());
            }
        }
    }

    /**
     * @return An {@link OrmFactoryRegistry}
     */
    public static OrmFactoryRegistry getOrmFactoryRegistry() {
        return ORM_FACTORY_REGISTRY;
    }

    /**
     * @return A {@link ValueFactory}
     */
    public static ValueFactory getValueFactory() {
        return VALUE_FACTORY;
    }

    /**
     * @return A {@link ModelFactory}
     */
    public static ModelFactory getModelFactory() {
        return MODEL_FACTORY;
    }

    /**
     * @return A {@link ValueConverterRegistry}
     */
    public static ValueConverterRegistry getValueConverterRegistry() {
        return VALUE_CONVERTER_REGISTRY;
    }

    /**
     * Get a required {@link OrmFactory} that works with your type of {@link Thing}.
     *
     * @param thingType The class of the type of {@link Thing} you need an {@link OrmFactory} for
     * @param <T>       The type of {@link Thing} the factory should work with
     * @return The {@link OrmFactory} for your {@link Thing}
     */
    public static <T extends Thing> OrmFactory<T> getRequiredOrmFactory(Class<T> thingType) {
        return ORM_FACTORY_REGISTRY.getFactoryOfType(thingType)
                // Or else throw a runtime exception.
                .orElseThrow(() -> new OrmTestCaseException("Missing required ORM Factory for thing " + thingType.getName()));
    }

    /**
     * Get a required {@link OrmFactory} as a different type -- Think the implementation class.
     *
     * @param thingType   The type of {@link Thing} the factory creates
     * @param factoryType The implementation class of the factory (or a different class you want to cast it to)
     * @param <T>         The type of thing
     * @param <F>         The factory class
     * @return The {@link OrmFactory} of your type, casted to the factoryType
     */
    public static <T extends Thing, F> F getRequiredOrmFactoryAs(Class<T> thingType, Class<F> factoryType) {
        return factoryType.cast(getRequiredOrmFactory(thingType));
    }

    /**
     * Inject the {@link OrmFactory}s that a particular service instance requires into it.
     *
     * @param serviceObject The instance of a service you are testing
     */
    public static void injectOrmFactoryReferencesIntoService(Object serviceObject) {
        Class<?> serviceClazz = serviceObject.getClass();
        // Stream over every field in the service class
        Arrays.stream(FieldUtils.getAllFields(serviceClazz))
                // Determine if an ORM Factory reference.
                .filter(OrmEnabledTestCase::determineIfOrmFactoryReference)
                // For each ORM factory reference.
                .forEach(field -> injectApplicableOrmFactory(field, serviceObject, serviceClazz));
    }

    /**
     * Dumps the content of a RepositoryConnection into a file in the maven target directory.
     *
     * @param filename The name of the file to dump to. Should include `.trig` extension.
     * @param conn The RepositoryConnection to dump.
     */
    public static void dumpRepoToTargetDir(String filename, RepositoryConnection conn) {
        try (FileOutputStream output = new FileOutputStream("target/" + filename)) {
            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.TRIG, output));
            conn.export(rdfWriter);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }


    private static void injectApplicableOrmFactory(final Field field, final Object serviceObject,
                                                   Class<?> serviceClazz) {
        // Find the matching ORM Factory.
        OrmFactory<?> targetFactory = ORM_FACTORIES.stream()
                .filter(factory -> field.getType().isAssignableFrom(factory.getClass()))
                .findFirst().orElseThrow(() -> new OrmTestCaseException("Missing factory for injection into "
                        + "specified service!  Requires type '" + field.getType().getName() + "'"));
        try {
            // Make sure the field can be accessed reflectively.
            field.setAccessible(true);
            // Set the field with our target OrmFactory.
            field.set(serviceObject, targetFactory);
        } catch (Exception e) {
            // If an exception occurs, throw our OrmTestCaseException to halt the test.
            throw new OrmTestCaseException("Issue injecting factory '" + targetFactory.getClass().getName()
                    + "' into service '" + serviceClazz.getName()
                    + "' using field '" + field.getName() + "'", e);
        }
    }

    @SuppressWarnings("unchecked")
    private static <T> void loadComponents(final String fileName, Class<T> type, List coll) {
        try {
            // Find every occurrence of files with the required name.
            final Enumeration<URL> resources = ClassLoader.getSystemClassLoader().getResources(fileName);
            // Iterate over them.
            while (resources.hasMoreElements()) {
                final URL resource = resources.nextElement();
                CONF_LOCATIONS.add(resource);
                for (final Class<?> clazz : loadSpecifiedClasses(resource.openStream())) {
                    // If the specific class is of the correct type.
                    if (type.isAssignableFrom(clazz)) {
                        // If the collection doesn't have an instance of this class yet...
                        if (coll.stream().map(Object::getClass).noneMatch(clazz::equals)) {
                            coll.add(clazz.getConstructor().newInstance());
                        }
                    } else {
                        // Fail if we find a class of the incorrect type in the list.
                        throw new OrmTestCaseException("Class '" + clazz.getName() + "' specified in '"
                                + resource.toString() + "' isn't of correct type: " + type.getName());
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            Assert.fail("Failed initializing test: " + e.getMessage());
        }
    }

    private static void initOrmFactory(OrmFactory<?> factory) {
        // If the given factory is an AbstractOrmFactory, we know how to initialize it.
        if (AbstractOrmFactory.class.isAssignableFrom(factory.getClass())) {
            ((AbstractOrmFactory<?>) factory).valueConverterRegistry = VALUE_CONVERTER_REGISTRY;
        } else {
            // Otherwise, it won't work in this framework.
            throw new OrmTestCaseException("OrmFactory '" + factory.getClass().getName()
                    + "' isn't an AbstractOrmFactory, so it can't be initialized by an ormFactories.conf file");
        }
    }

    private static Set<Class<?>> loadSpecifiedClasses(final InputStream is) throws IOException, ClassNotFoundException {
        final Set<Class<?>> set = new HashSet<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is))) {
            // For each non-blank line.
            set.addAll(br.lines().filter(StringUtils::isNotBlank).map(name -> {
                // Map to the class.
                try {
                    return OrmEnabledTestCase.class.getClassLoader().loadClass(name);
                } catch (Exception e) {
                    throw new OrmTestCaseException("Issue loading class specified in conf file", e);
                }
                //Collect all the items into a set.
            }).collect(Collectors.toSet()));

        }
        return set;
    }

    private static void registerOrmFactory(OrmFactory<?> factory) throws OrmTestCaseException {
        try {
            // Reflectively register an OrmFactory in our factory registry.
            Method method = OrmFactoryRegistryImpl.class.getDeclaredMethod("addFactory", OrmFactory.class);
            method.setAccessible(true);
            method.invoke(ORM_FACTORY_REGISTRY, factory);
        } catch (Exception e) {
            throw new OrmTestCaseException("Issue registering OrmFactory", e);
        }
    }

    private static boolean determineIfOrmFactoryReference(final Field field) {
        boolean includeField = false;
        // Return type is void, one parameter, and OrmFactory is assignable from the parameter type.
        if (OrmFactory.class.isAssignableFrom(field.getType())) {
            // Include the method in the injection analysis process.
            includeField = true;
        }
        return includeField;
    }

    private static String tab(String in) {
        return String.format("\t%s", in);
    }
}
