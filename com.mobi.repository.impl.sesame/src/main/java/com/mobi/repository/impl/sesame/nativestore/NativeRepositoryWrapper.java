package com.mobi.repository.impl.sesame.nativestore;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
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

import aQute.bnd.annotation.component.*;
import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.repository.api.Repository;
import com.mobi.repository.base.RepositoryWrapper;
import com.mobi.repository.exception.RepositoryConfigException;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.apache.commons.lang3.StringUtils;
import com.mobi.repository.api.DelegatingRepository;
import com.mobi.repository.api.Repository;
import com.mobi.repository.base.RepositoryWrapper;
import com.mobi.repository.exception.RepositoryConfigException;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.nativerdf.NativeStore;

import java.io.File;
import java.util.Map;
import java.util.Set;

@Component(
        immediate = true,
        provide = { Repository.class, DelegatingRepository.class },
        name = NativeRepositoryWrapper.NAME,
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = NativeRepositoryConfig.class,
        properties = {
                "repositorytype=" + NativeRepositoryWrapper.REPOSITORY_TYPE
        }
)
public class NativeRepositoryWrapper extends RepositoryWrapper {

    protected static final String REPOSITORY_TYPE = "native";
    protected static final String NAME = "com.mobi.service.repository." + REPOSITORY_TYPE;

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

        SesameRepositoryWrapper repo = new SesameRepositoryWrapper(new SailRepository(sesameNativeStore));
        repo.setConfig(config);

        return repo;
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
