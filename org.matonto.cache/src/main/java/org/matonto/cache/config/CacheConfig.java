package org.matonto.cache.config;

import aQute.bnd.annotation.metatype.Meta;

/**
 * Base configuration for Cache Objects.
 */
@Meta.OCD
public interface CacheConfig {

    /**
     * The Cache ID
     *
     * @return The String representing the Cache ID
     */
    String id();
}
