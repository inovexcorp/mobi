package org.matonto.repository.impl.sesame.memory;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.metatype.Configurable;
import org.matonto.repository.api.Repository;
import org.matonto.repository.base.RepositoryWrapper;
import org.matonto.repository.config.RepositoryConfigException;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import java.io.File;
import java.util.Map;

@Component(
        provide = Repository.class,
        name = MemoryRepositoryWrapper.NAME,
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = MemoryRepositoryConfig.class,
        properties = {
                "repositorytype=" + MemoryRepositoryWrapper.REPOSITORY_TYPE
        }
)
public class MemoryRepositoryWrapper extends RepositoryWrapper {

    protected static final String REPOSITORY_TYPE = "memory";
    protected static final String NAME = "org.matonto.service.repository." + REPOSITORY_TYPE;

    @Override
    protected Repository getRepo(Map<String, Object> props) {
        MemoryRepositoryConfig config = Configurable.createConfigurable(MemoryRepositoryConfig.class, props);
        this.repositoryID = config.id();

        MemoryStore sesameMemoryStore;

        if (props.containsKey("dataDir")) {
            File file = new File(config.dataDir());
            sesameMemoryStore = new MemoryStore(file);
        } else {
            sesameMemoryStore = new MemoryStore();
        }

        if (props.containsKey("syncDelay")) {
            sesameMemoryStore.setSyncDelay(config.syncDelay());
        }

        return new SesameRepositoryWrapper(new SailRepository(sesameMemoryStore));
    }

    @Override
    public void validateConfig(Map<String, Object> props) {
        super.validateConfig(props);
        MemoryRepositoryConfig config = Configurable.createConfigurable(MemoryRepositoryConfig.class, props);

        if (props.containsKey("dataDir")) {
            if (config.dataDir().equals(""))
                throw new RepositoryConfigException(
                        new IllegalArgumentException("Repository property 'dataDir' cannot be empty.")
                );
        }
    }
}
