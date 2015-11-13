package org.matonto.repository.config;

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;

public class AbstractRepositoryImplConfig implements RepositoryImplConfig {

    @Override
    public RepositoryType getType() {
        return null;
    }

    protected

    @Override
    public Resource getResource() {
        return null;
    }

    @Override
    public Model export() {
        return null;
    }

    @Override
    public void parse(Model model, Resource resource) throws RepositoryConfigException {

    }

    @Override
    public void validate() throws RepositoryConfigException {

    }
}
