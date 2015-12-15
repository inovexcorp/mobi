package org.matonto.repository.impl.core;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.repository.api.DelegatingRepository;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryManager;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Component
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
}
