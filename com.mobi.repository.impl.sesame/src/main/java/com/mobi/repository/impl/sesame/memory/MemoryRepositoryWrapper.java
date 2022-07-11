package com.mobi.repository.impl.sesame.memory;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.base.OsgiRepositoryWrapper;
import com.mobi.repository.impl.sesame.RepositoryConfigHelper;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.Designate;

import java.io.File;

@Component(
        immediate = true,
        service = { OsgiRepository.class },
        name = MemoryRepositoryWrapper.NAME,
        configurationPolicy = ConfigurationPolicy.REQUIRE,
        property = {
                "repositorytype=" + MemoryRepositoryWrapper.REPOSITORY_TYPE
        }
)
@Designate(ocd = MemoryRepositoryConfig.class)
public class MemoryRepositoryWrapper extends OsgiRepositoryWrapper {

    protected static final String REPOSITORY_TYPE = "memory";
    protected static final String NAME = "com.mobi.service.repository." + REPOSITORY_TYPE;

    @Activate
    public void start(final MemoryRepositoryConfig config) {
        RepositoryConfigHelper.validateBaseParams(config.id(), config.title());
        RepositoryConfigHelper.validateIndexes(config.tripleIndexes());

        MemoryStore sesameMemoryStore;
        if ("".equals(config.dataDir()) || config.dataDir() == null) {
            sesameMemoryStore = new MemoryStore();
        } else {
            File file = new File(config.dataDir());
            sesameMemoryStore = new MemoryStore(file);
        }
        sesameMemoryStore.setSyncDelay(config.syncDelay());

        Repository repo = new SailRepository(sesameMemoryStore);
        setDelegate(repo);
        this.repositoryID = config.id();
        this.repositoryTitle = config.title();
    }

    @Deactivate
    protected void stop() {
        try {
            getDelegate().shutDown();
        } catch (RepositoryException e) {
            throw new RepositoryException("Could not shutdown Repository \"" + repositoryID + "\".", e);
        }
    }

    @Modified
    protected void modified(final MemoryRepositoryConfig config) {
        stop();
        start(config);
    }

    @Override
    public Class<MemoryRepositoryConfig> getConfigType() {
        return MemoryRepositoryConfig.class;
    }
}
