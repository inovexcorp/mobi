package org.matonto.rdf.orm.conversion.impl;

/*-
 * #%L
 * RDF ORM
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.OrmException;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ForkJoinPool;
import java.util.stream.Collectors;

/**
 * The default {@link ValueConverterRegistry} instance.
 *
 * @author bdgould
 */
@Component(immediate = true)
public class DefaultValueConverterRegistry implements ValueConverterRegistry {

    /**
     * {@link ForkJoinPool} that we'll use for value conversion. We will use the
     * maximum available processors in our pool.
     */
    private static final ForkJoinPool JOIN_POOL = new ForkJoinPool(Runtime.getRuntime().availableProcessors());

    /**
     * {@link Map} of type to boxified type. Boxified meaning if it's a
     * primitive class type, it will return the object wrapper type.
     */
    private static final Map<Class<?>, Class<?>> boxifyMap = new HashMap<>();

    /**
     * Simple static constructor to handle the "boxification" of primitives.
     */
    static {
        boxifyMap.put(boolean.class, Boolean.class);
        boxifyMap.put(byte.class, Byte.class);
        boxifyMap.put(short.class, Short.class);
        boxifyMap.put(char.class, Character.class);
        boxifyMap.put(int.class, Integer.class);
        boxifyMap.put(long.class, Long.class);
        boxifyMap.put(float.class, Float.class);
        boxifyMap.put(double.class, Double.class);
    }

    /**
     * The {@link Map} of registered {@link ValueConverter} objects, organized
     * by their types.
     */
    private final Map<Class<?>, List<ValueConverter<?>>> registry = new HashMap<>();

    /**
     * This method will "boxify" primitives into their {@link Object} type.
     *
     * @param type The type to try and boxify
     * @return The "boxified" type, or the original if it is already not a
     * primitive
     */
    @SuppressWarnings("unchecked")
    protected static <T> Class<T> boxify(final Class<T> type) {
        if (type.isPrimitive() && boxifyMap.containsKey(type)) {
            return (Class<T>) boxifyMap.get(type);
        } else {
            return type;
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public <T> T convertValue(final Value value, final Thing thing, final Class<T> desiredType) throws OrmException {
        final ValueConverter<T> converter = getValueConverter(boxify(desiredType));
        if (converter != null) {
            return converter.convertValue(value, thing, desiredType);
        } else {
            throw new OrmException(
                    "No value converter was registered for desired type '" + desiredType.getName() + "'");
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public <T> Value convertType(T type, Thing thing) throws OrmException {
        @SuppressWarnings("unchecked")
        final ValueConverter<T> converter = getValueConverter(boxify((Class<T>) type.getClass()));
        if (converter != null) {
            return converter.convertType(type, thing);
        } else {
            throw new OrmException(
                    "No value converter was registered for desired type '" + type.getClass().getName() + "'");
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public <T> Set<T> convertValues(Set<Value> values, Thing thing, Class<T> desiredType) throws OrmException {
        final ValueConverter<T> converter = getValueConverter(desiredType);
        if (converter != null) {
            final List<Exception> exceptions = new ArrayList<>();
            try {
                return JOIN_POOL.submit(() -> {
                    final Set<T> result = values.parallelStream().map(value -> {
                        try {
                            return converter.convertValue(value, thing, desiredType);
                        } catch (Exception e) {
                            exceptions.add(e);
                            return null;
                        }
                    }).collect(Collectors.toSet());
                    if (exceptions.isEmpty()) {
                        return result;
                    } else {
                        throw new ValueConversionException(
                                "Issue converting values to desired type for the specified reasons:", exceptions);
                    }
                }).get();
            } catch (InterruptedException | ExecutionException e) {
                throw new ValueConversionException("Issue processing values in multi-threaded mode", e);
            }
        } else {
            throw new ValueConversionException(
                    "No ValueConverter registered to handle desired type: " + desiredType.getName());
        }
    }

    @Override
    public <T> Set<Value> convertTypes(Set<T> types, Thing thing) throws OrmException {
        if (types.isEmpty()) {
            return new HashSet<>();
        } else {
            @SuppressWarnings("unchecked")
            final ValueConverter<T> converter = getValueConverter(boxify((Class<T>) types.iterator().next().getClass()));
            if (converter != null) {
                final List<Exception> exceptions = new ArrayList<>();
                try {
                    return JOIN_POOL.submit(() -> {
                        final Set<Value> result = types.parallelStream().map(type -> {
                            try {
                                return converter.convertType(type, thing);
                            } catch (Exception e) {
                                exceptions.add(e);
                                return null;
                            }
                        }).collect(Collectors.toSet());
                        if (exceptions.isEmpty()) {
                            return result;
                        } else {
                            throw new ValueConversionException(
                                    "Issue converting values to desired type for the specified reasons:", exceptions);
                        }
                    }).get();
                } catch (InterruptedException | ExecutionException e) {
                    throw new ValueConversionException("Issue processing values in multi-threaded mode", e);
                }
            } else {
                throw new ValueConversionException(
                        "No ValueConverter registered to handle desired type: " + types.iterator().next().getClass());
            }
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @SuppressWarnings("unchecked")
    public <T> ValueConverter<T> getValueConverter(final Class<T> type) {
        ValueConverter<T> result = null;
        if (registry.containsKey(type)) {
            result = (ValueConverter<T>) registry.get(type).get(0);
        } else {
            // Recurse on directly implemented interfaces
            for (Class<?> clazz : type.getInterfaces()) {
                result = (ValueConverter<T>) getValueConverter(clazz);
                if (result != null) break;
            }
            // Recurse on super class
            if (result == null && type.getSuperclass() != null) {
                result = (ValueConverter<T>) getValueConverter(type.getSuperclass());
            }
        }
        return result;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Reference(multiple = true, dynamic = true, unbind = "unregisterValueConverter")
    public <T> void registerValueConverter(final ValueConverter<T> converter) {
        final Class<T> type = converter.getType();
        if (!registry.containsKey(type)) {
            registry.put(type, new ArrayList<>());
        }
        registry.get(type).add(converter);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public <T> void unregisterValueConverter(final ValueConverter<T> converter) {
        final Class<T> type = converter.getType();

        if (registry.containsKey(type)) {
            registry.get(type).remove(converter);

            if (registry.get(type).size() == 0) {
                registry.remove(type);
            }
        }
    }

}
