package com.mobi.repository.impl.sesame.nativestore;

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
import com.mobi.repository.exception.RepositoryConfigException;
import com.mobi.repository.impl.sesame.RepositoryConfigHelper;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.nativerdf.NativeStore;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.Designate;

import java.io.File;
import java.util.Arrays;
import java.util.List;

@Component(
        immediate = true,
        service = { OsgiRepository.class },
        name = NativeRepositoryWrapper.NAME,
        configurationPolicy = ConfigurationPolicy.REQUIRE,
        property = {
                "repositorytype=" + NativeRepositoryWrapper.REPOSITORY_TYPE
        }
)
@Designate(ocd = NativeRepositoryConfig.class)
public class NativeRepositoryWrapper extends OsgiRepositoryWrapper {

    protected static final String REPOSITORY_TYPE = "native";
    protected static final String NAME = "com.mobi.service.repository." + REPOSITORY_TYPE;

    @Activate
    protected void start(final NativeRepositoryConfig config) {
        RepositoryConfigHelper.validateBaseParams(config.id(), config.title());
        RepositoryConfigHelper.validateIndexes(config.tripleIndexes());

        if (StringUtils.isEmpty(config.dataDir())) {
            throw new RepositoryConfigException(
                    new IllegalArgumentException("Repository property 'dataDir' cannot be empty.")
            );
        }

        NativeStore nativeStore = new NativeStore();
        File file = new File(config.dataDir());
        nativeStore.setDataDir(file);

        List<String> indexes = Arrays.asList(config.tripleIndexes());
        String indexString = StringUtils.join(indexes, ",");
        nativeStore.setTripleIndexes(indexString);

        Repository repo = new SailRepository(nativeStore);
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
    protected void modified(final NativeRepositoryConfig config) {
        stop();
        start(config);
    }

    @Override
    public Class<NativeRepositoryConfig> getConfigType() {
        return NativeRepositoryConfig.class;
    }
}
