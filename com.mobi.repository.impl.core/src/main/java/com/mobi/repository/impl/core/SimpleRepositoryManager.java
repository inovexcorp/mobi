package com.mobi.repository.impl.core;

/*-
 * #%L
 * com.mobi.repository.impl.core
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.base.OsgiRepositoryWrapper;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Component(immediate = true)
public class SimpleRepositoryManager implements RepositoryManager {

    private static final String REPO_PREFIX = "https://mobi.solutions/repos/";
    private final ValueFactory vf = new ValidatingValueFactory();

    protected Map<String, OsgiRepository> initializedRepositories = new HashMap<>();

    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
    public void addRepository(OsgiRepository repository) {
        initializedRepositories.put(repository.getRepositoryID(), repository);
    }

    public void removeRepository(OsgiRepository repository) {
        initializedRepositories.remove(repository.getRepositoryID());
    }

    @Override
    public Optional<OsgiRepository> getRepository(String id) {
        if (initializedRepositories.containsKey(id)) {
            return Optional.of(initializedRepositories.get(id));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public Optional<OsgiRepository> getRepository(IRI repositoryIRI) {
        String id = repositoryIRI.stringValue().substring(REPO_PREFIX.length());
        if (initializedRepositories.containsKey(id)) {
            return Optional.of(initializedRepositories.get(id));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public Optional<IRI> getRepositoryIRI(String id) {
        if (initializedRepositories.containsKey(id)) {
            return Optional.of(vf.createIRI(REPO_PREFIX + id));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public Map<String, OsgiRepository> getAllRepositories() {
        return new HashMap<>(initializedRepositories);
    }

    @Override
    public OsgiRepository createMemoryRepository() {
        // TODO: Should we create and return a service here? A service reference?
        OsgiRepositoryWrapper repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        return repo;
    }
}
