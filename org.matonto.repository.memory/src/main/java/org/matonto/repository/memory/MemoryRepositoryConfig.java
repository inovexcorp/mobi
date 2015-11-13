package org.matonto.repository.memory;

import aQute.bnd.annotation.metatype.Meta;
import org.matonto.repository.config.RepositoryConfig;

public interface MemoryRepositoryConfig extends RepositoryConfig {

    @Meta.AD(required = false)
    long syncDelay();
}
