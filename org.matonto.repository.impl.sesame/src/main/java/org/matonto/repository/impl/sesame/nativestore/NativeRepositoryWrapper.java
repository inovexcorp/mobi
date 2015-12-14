package org.matonto.repository.impl.sesame.nativestore;

import aQute.bnd.annotation.component.*;
import aQute.bnd.annotation.metatype.Configurable;
import org.apache.commons.lang3.StringUtils;
import org.matonto.repository.api.DelegatingRepository;
import org.matonto.repository.api.Repository;
import org.matonto.repository.base.RepositoryWrapper;
import org.matonto.repository.exception.RepositoryConfigException;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.nativerdf.NativeStore;

import java.io.File;
import java.util.Map;
import java.util.Set;

@Component(
        provide = DelegatingRepository.class,
        name = NativeRepositoryWrapper.NAME,
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = NativeRepositoryConfig.class,
        properties = {
                "repositorytype=" + NativeRepositoryWrapper.REPOSITORY_TYPE
        }
)
public class NativeRepositoryWrapper extends RepositoryWrapper {

    protected static final String REPOSITORY_TYPE = "native";
    protected static final String NAME = "org.matonto.service.repository." + REPOSITORY_TYPE;

    @Override
    protected Repository getRepo(Map<String, Object> props) {
        NativeRepositoryConfig config = Configurable.createConfigurable(NativeRepositoryConfig.class, props);
        this.repositoryID = config.id();

        NativeStore sesameNativeStore = new NativeStore();

        if (props.containsKey("dataDir")) {
            File file = new File(config.dataDir());
            sesameNativeStore.setDataDir(file);
        }

        if (props.containsKey("tripleIndexes")) {
            Set<String> indexes = config.tripleIndexes();
            String indexString = StringUtils.join(indexes, ",");
            sesameNativeStore.setTripleIndexes(indexString);
        }

        return new SesameRepositoryWrapper(new SailRepository(sesameNativeStore));
    }

    @Override
    public void validateConfig(Map<String, Object> props) {
        super.validateConfig(props);
        NativeRepositoryConfig config = Configurable.createConfigurable(NativeRepositoryConfig.class, props);

        if (props.containsKey("dataDir")) {
            if (config.dataDir().equals(""))
                throw new RepositoryConfigException(
                        new IllegalArgumentException("Repository property 'dataDir' cannot be empty.")
                );
        }

        if (props.containsKey("tripleIndexes")) {
            config.tripleIndexes().forEach(index -> {
                // Make sure String matches index regex
                if (!index.matches("^(?!.*s.*s)(?!.*p.*p)(?!.*o.*o)(?!.*c.*c)[spoc]{4}$"))
                    throw new RepositoryConfigException(new IllegalArgumentException("Invalid Triple Index"));
            });
        }
    }

    @Activate
    protected void start(Map<String, Object> props) {
        super.start(props);
    }

    @Deactivate
    protected void stop() {
        super.stop();
    }

    @Modified
    protected void modified(Map<String, Object> props) {
        super.modified(props);
    }
}
