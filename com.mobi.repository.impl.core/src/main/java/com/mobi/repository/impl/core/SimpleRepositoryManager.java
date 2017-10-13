package com.mobi.repository.impl.core;

/*-
 * #%L
 * com.mobi.repository.impl.core
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import com.mobi.repository.api.DelegatingRepository;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Component(immediate = true)
public class SimpleRepositoryManager implements RepositoryManager {

    protected Map<String, Repository> initializedRepositories = new HashMap<>();

    @Reference(type = '*', dynamic = true)
    public void addRepository(DelegatingRepository repository) {
        initializedRepositories.put(repository.getRepositoryID(), repository);
    }

    public void removeRepository(DelegatingRepository repository) {
        initializedRepositories.remove(repository.getRepositoryID());
    }

    @Override
    public Optional<Repository> getRepository(String id) {
        if (initializedRepositories.containsKey(id)) {
            return Optional.of(initializedRepositories.get(id));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public Map<String, Repository> getAllRepositories() {
        return new HashMap<>(initializedRepositories);
    }

    @Override
    public Repository createMemoryRepository() {
        // TODO: Should we create and return a service here? A service reference?
        return new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
    }
}
