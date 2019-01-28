package com.mobi.repository.impl.sesame.http;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import org.apache.commons.validator.routines.UrlValidator;
import org.eclipse.rdf4j.repository.http.HTTPRepository;

import java.util.Map;

@Component(
        immediate = true,
        provide = { Repository.class, DelegatingRepository.class },
        name = HTTPRepositoryWrapper.NAME,
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = HTTPRepositoryConfig.class,
        properties = {
                "repositorytype=" + HTTPRepositoryWrapper.REPOSITORY_TYPE
        }
)
public class HTTPRepositoryWrapper extends RepositoryWrapper {

    protected static final String REPOSITORY_TYPE = "http";
    protected static final String NAME = "com.mobi.service.repository." + REPOSITORY_TYPE;

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

    @Override
    protected Repository getRepo(Map<String, Object> props) {
        HTTPRepositoryConfig config = Configurable.createConfigurable(HTTPRepositoryConfig.class, props);
        this.repositoryID = config.id();

        HTTPRepository sesameHttpStore = new HTTPRepository(config.serverUrl(), this.repositoryID);

        SesameRepositoryWrapper repo = new SesameRepositoryWrapper(sesameHttpStore);
        repo.setConfig(config);

        return repo;
    }

    @Override
    public void validateConfig(Map<String, Object> props) {
        super.validateConfig(props);
        HTTPRepositoryConfig config = Configurable.createConfigurable(HTTPRepositoryConfig.class, props);

        String[] schemes = {"http","https"};
        UrlValidator urlValidator = new UrlValidator(schemes, UrlValidator.ALLOW_LOCAL_URLS);
        if (!urlValidator.isValid(config.serverUrl())) {
            throw new RepositoryConfigException(
                    new IllegalArgumentException("Repository serverUrl is not a valid URL: " + config.serverUrl())
            );
        }
    }
}
