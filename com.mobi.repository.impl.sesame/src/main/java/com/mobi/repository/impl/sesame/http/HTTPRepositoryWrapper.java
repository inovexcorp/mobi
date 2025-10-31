package com.mobi.repository.impl.sesame.http;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.http.HTTPRepository;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.Designate;

import java.util.Optional;

@Component(
        immediate = true,
        service = { OsgiRepository.class },
        name = HTTPRepositoryWrapper.NAME,
        configurationPolicy = ConfigurationPolicy.REQUIRE,
        property = {
                "repositorytype=" + HTTPRepositoryWrapper.REPOSITORY_TYPE
        }
)
@Designate(ocd = HTTPRepositoryConfig.class)
public class HTTPRepositoryWrapper extends OsgiRepositoryWrapper {

    protected static final String REPOSITORY_TYPE = "http";
    protected static final String NAME = "com.mobi.service.repository." + REPOSITORY_TYPE;

    @Activate
    protected void start(final HTTPRepositoryConfig config) {
        RepositoryConfigHelper.validateBaseParams(config.id(), config.title());
        RepositoryConfigHelper.validateUrl(config.serverUrl(), "serverUrl");

        HTTPRepository httpRepository = new HTTPRepository(config.serverUrl(), this.repositoryID);
        setDelegate(httpRepository);
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
    protected void modified(final HTTPRepositoryConfig config) {
        stop();
        start(config);
    }

    @Override
    public Class<HTTPRepositoryConfig> getConfigType() {
        return HTTPRepositoryConfig.class;
    }

    @Override
    public String getRepositoryType() {
        return REPOSITORY_TYPE;
    }

    @Override
    public Optional<Long> getLimit() {
        return Optional.empty();
    }

    @Override
    public Optional<Long> getTripleCount() {
        return Optional.empty();
    }

}
