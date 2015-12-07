package org.matonto.repository.impl.sesame.memory;

import aQute.bnd.annotation.metatype.Meta;
import org.matonto.repository.config.RepositoryConfig;

/**
 * Configuration for in-memory Repository Objects
 */
public interface MemoryRepositoryConfig extends RepositoryConfig {

    /**
     * The syncDelay for write-backs to disk. This is an optional property
     * used in conjunction with dataDir.
     *
     * @return The long representing the syncDelay
     */
    @Meta.AD(required = false)
    long syncDelay();
}
