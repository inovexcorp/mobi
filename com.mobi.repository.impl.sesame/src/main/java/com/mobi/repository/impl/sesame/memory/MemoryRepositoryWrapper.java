package com.mobi.repository.impl.sesame.memory;

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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.repository.api.DelegatingRepository;
import com.mobi.repository.api.Repository;
import com.mobi.repository.base.RepositoryWrapper;
import com.mobi.repository.exception.RepositoryConfigException;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;

import java.io.File;
import java.util.Map;

@Component(
        immediate = true,
        provide = { Repository.class, DelegatingRepository.class },
        name = MemoryRepositoryWrapper.NAME,
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = MemoryRepositoryConfig.class,
        properties = {
                "repositorytype=" + MemoryRepositoryWrapper.REPOSITORY_TYPE
        }
)
public class MemoryRepositoryWrapper extends RepositoryWrapper {

    protected static final String REPOSITORY_TYPE = "memory";
    protected static final String NAME = "com.mobi.service.repository." + REPOSITORY_TYPE;

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

        SesameRepositoryWrapper repo = new SesameRepositoryWrapper(new SailRepository(sesameMemoryStore));
        repo.setConfig(config);

        return repo;
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
