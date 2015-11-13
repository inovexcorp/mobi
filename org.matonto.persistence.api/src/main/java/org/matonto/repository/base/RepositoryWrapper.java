package org.matonto.repository.base;

import aQute.bnd.annotation.metatype.Configurable;
import org.matonto.repository.api.DelegatingRepository;
import org.matonto.repository.api.Repository;
import org.matonto.repository.config.RepositoryConfig;
import org.matonto.repository.config.RepositoryConfigException;
import org.matonto.repository.exception.RepositoryException;

import java.util.Map;

public abstract class RepositoryWrapper implements DelegatingRepository {

    protected static final String REPOSITORY_TYPE = "default";

    private volatile Repository delegate;
    protected String repositoryID;

    /**
     * Creates a new <tt>RepositoryWrapper</tt>.
     */
    public RepositoryWrapper() {
    }

    /**
     * Creates a new <tt>RepositoryWrapper</tt> and calls
     * {@link #setDelegate(Repository)} with the supplied delegate repository.
     */
    public RepositoryWrapper(Repository delegate) {
        setDelegate(delegate);
    }

    @Override
    public Repository getDelegate() {
        return delegate;
    }

    @Override
    public void setDelegate(Repository delegate) {
        this.delegate = delegate;
    }

    public String getRepositoryID() {
        return this.repositoryID;
    }

    public void setRepositoryID(String repositoryID) {
        this.repositoryID = repositoryID;
    }

    public String getRepositoryType() {
        return REPOSITORY_TYPE;
    }

    protected void start(Map<String, Object> props) {
        validateConfig(props);
        Repository repo = getRepo(props);
        try {
            repo.initialize();
        } catch (RepositoryException e) {
            e.printStackTrace();
        }
        setDelegate(repo);
    }

    protected void stop() {
        try {
            getDelegate().shutDown();
        } catch (RepositoryException e) {
            e.printStackTrace();
        }
    }

    protected void modified(Map<String, Object> props) {
        try {
            getDelegate().shutDown();
        } catch (RepositoryException e) {
            throw new RuntimeException(e);
        }

        validateConfig(props);
        Repository repo;
        try {
            repo = getRepo(props);
            repo.initialize();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        setDelegate(repo);
    }

    protected abstract Repository getRepo(Map<String, Object> props);

    @Override
    public void initialize() {
        throw new UnsupportedOperationException("A shared service cannot be initialized by a third party");
    }

    @Override
    public void shutDown() {
        throw new UnsupportedOperationException("A shared service cannot be destroyed by a third party");
    }

    public void validateConfig(Map<String, Object> props) {
        RepositoryConfig config = Configurable.createConfigurable(RepositoryConfig.class, props);

        if (config.id().equals(""))
            throw new RepositoryConfigException(
                    new IllegalArgumentException("Repository property 'id' cannot be empty.")
            );
        if (config.title().equals(""))
            throw new RepositoryConfigException(
                    new IllegalArgumentException("Repository property 'title' cannot be empty.")
            );
    }
}
