package org.matonto.repository.impl.sesame.memory;

import aQute.bnd.annotation.metatype.Meta;
import org.matonto.repository.config.RepositoryConfig;

public interface MemoryRepositoryConfig extends RepositoryConfig {

    @Meta.AD(required = false)
    long syncDelay();
}
