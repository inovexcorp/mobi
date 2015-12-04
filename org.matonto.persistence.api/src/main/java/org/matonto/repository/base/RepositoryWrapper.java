package org.matonto.repository.base;

import aQute.bnd.annotation.metatype.Configurable;
import org.matonto.repository.api.DelegatingRepository;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.config.RepositoryConfig;
import org.matonto.repository.exception.RepositoryConfigException;
import org.matonto.repository.exception.RepositoryException;

import java.io.File;
import java.util.Map;
import java.util.Optional;

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
        RepositoryConfig config = Configurable.createConfigurable(RepositoryConfig.class, props);

        Repository repo = getRepo(props);
        try {
            repo.initialize();
        } catch (RepositoryException e) {
            throw new RepositoryException("Could not initialize Repository \"" + config.id() + "\".", e);
        }
        setDelegate(repo);

        setRepositoryID(config.id());
    }

    protected void stop() {
        try {
            getDelegate().shutDown();
        } catch (RepositoryException e) {
            throw new RepositoryException("Could not shutdown Repository \"" + repositoryID + "\".", e);
        }
    }

    protected void modified(Map<String, Object> props) {
        stop();
        start(props);
    }

    protected abstract Repository getRepo(Map<String, Object> props);

    @Override
    public RepositoryConnection getConnection() throws RepositoryException {
        return delegate.getConnection();
    }

    @Override
    public Optional<File> getDataDir() {
        return delegate.getDataDir();
    }

    @Override
    public void initialize() {
        throw new UnsupportedOperationException("A shared service cannot be initialized by a third party");
    }

    @Override
    public boolean isInitialized() {
        return delegate.isInitialized();
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
